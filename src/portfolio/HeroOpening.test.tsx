import { useRef } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { HeroOpening } from "./HeroOpening";
import { PortfolioPage } from "./PortfolioPage";
import { useGlassOpening, openingHoldDuration } from "./useGlassOpening";
import { heroOpeningMotion as motion } from "./hero-opening.config";

function Scene() {
  const root = useRef<HTMLDivElement>(null);
  const remaining = useGlassOpening(root);
  return <div ref={root} className="portfolio-v2 v2-cinematic-site" data-testid="scene" data-opening="pending">
    <HeroOpening remaining={remaining} />
    <main><div data-v2-opening-gallery>实时照片隧道</div></main>
  </div>;
}
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

it("waits for the film to end before freezing, revealing the tunnel, fading the film and opening the copy", () => {
  const { container } = render(<Scene />);
  const scene = screen.getByTestId("scene");
  const video = container.querySelector("video")!;
  advance(openingHoldDuration - 100);
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  advance(100);
  expect(scene).toHaveAttribute("data-opening", "film");
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
  advance(5000);
  expect(scene).toHaveAttribute("data-opening", "film");
  fireEvent.ended(video);
  expect(scene).toHaveAttribute("data-opening", "freeze");
  advance(motion.freezeMs);
  expect(scene).toHaveAttribute("data-opening", "tunnel");
  advance(motion.tunnelRevealMs + motion.tunnelHoldMs);
  expect(scene).toHaveAttribute("data-opening", "handoff");
  advance(motion.filmFadeMs);
  expect(scene).toHaveAttribute("data-opening", "playing");
  expect(container.querySelector("main")).toHaveAttribute("inert");
  advance(motion.contentRevealMs);
  expect(scene).toHaveAttribute("data-opening", "complete");
  expect(container.querySelector("main")).not.toHaveAttribute("inert");
  expect(document.body.style.overflow).not.toBe("hidden");
});

it("holds an exact local end frame and skips the film safely if it cannot be loaded", () => {
  const { container } = render(<Scene />);
  expect(container.querySelector(".v2-light-end-frame")).toHaveAttribute("src", "/media/hero-opening/light-rebuild-v4-end.webp");
  expect(container.querySelector("video")).not.toHaveAttribute("loop");
  fireEvent.error(container.querySelector("video")!);
  advance(openingHoldDuration);
  expect(screen.getByTestId("scene")).toHaveAttribute("data-opening", "freeze");
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
});

it("allows skipping the opening and restores scroll and interaction immediately", () => {
  const { container } = render(<Scene />);
  fireEvent.click(screen.getByRole("button", { name: "跳过开场" }));
  expect(screen.getByTestId("scene")).toHaveAttribute("data-opening", "complete");
  expect(container.querySelector("main")).not.toHaveAttribute("inert");
  expect(vi.getTimerCount()).toBe(0);
});

it("pauses the composite's clock in a hidden tab and resumes without skipping phases", () => {
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  const { container } = render(<Scene />);
  advance(openingHoldDuration);
  fireEvent.ended(container.querySelector("video")!);
  hidden.mockReturnValue(true);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  advance(60000);
  expect(screen.getByTestId("scene")).toHaveAttribute("data-opening", "freeze");
  hidden.mockReturnValue(false);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  advance(motion.freezeMs);
  expect(screen.getByTestId("scene")).toHaveAttribute("data-opening", "tunnel");
});

it("honors reduced motion with a static end frame instead of auto-playing the film", () => {
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({ matches: query.includes("prefers-reduced-motion"), media: query,
    onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() }));
  render(<Scene />);
  advance(openingHoldDuration);
  expect(screen.getByTestId("scene")).toHaveAttribute("data-opening", "freeze");
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
});

it("releases the page when a loaded player stalls without an ended or error event", () => {
  render(<Scene />);
  advance(openingHoldDuration + motion.mediaTimeoutMs);
  expect(screen.getByTestId("scene")).toHaveAttribute("data-opening", "freeze");
  advance(motion.freezeMs + motion.tunnelRevealMs + motion.tunnelHoldMs + motion.filmFadeMs + motion.contentRevealMs);
  expect(screen.getByTestId("scene")).toHaveAttribute("data-opening", "complete");
  expect(document.body.style.overflow).not.toBe("hidden");
});

it("cleans up the cinematic clock and restores original scrolling when unmounted during the film", () => {
  const previous = document.body.style.overflow;
  document.body.style.overflow = "auto";
  const { unmount } = render(<Scene />);
  advance(openingHoldDuration);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
  expect(document.body.style.overflow).toBe("auto");
  document.body.style.overflow = previous;
});

it("offers a hero-only preview that shares the real hero and has no later modules", () => {
  const { container } = render(<PortfolioPage heroOnly />);
  expect(container.querySelectorAll("main > section")).toHaveLength(1);
  expect(container.querySelector("#home .v2-tunnel-region")).not.toBeNull();
  expect(container.querySelector("#experience, #projects, #practice, .v2-footer")).toBeNull();
  expect(screen.getByRole("link", { name: "个人作品集" })).toHaveAttribute("href", "/#projects");
});
