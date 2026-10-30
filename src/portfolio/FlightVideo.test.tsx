import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { FlightVideo } from "./FlightVideo";
import { Works } from "./Works";
import { portfolioContent } from "./content";

let reduced = false;
vi.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => reduced }));
let callbacks: IntersectionObserverCallback[] = [];
beforeEach(() => {
  reduced = false;
  callbacks = [];
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { callbacks.push(callback); }
    observe() {}
    disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const visibility = (visible: boolean) => act(() => callbacks.forEach((callback) => callback(
  [{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver,
)));

it("places film one in the right slot and films two and three on the left with original aspect ratios", () => {
  const { container } = render(<Works content={portfolioContent} onView={() => {}} />);
  const videos = container.querySelectorAll("video");
  expect(videos).toHaveLength(3);
  videos.forEach((video) => expect(video).not.toHaveAttribute("src"));
  visibility(true);
  videos.forEach((video, index) => {
    expect(video.closest("article")).toHaveClass(`v2-flight-slot-${index + 1}`);
    expect(video).toHaveAttribute("src", `/media/flight/optimized/v1/${index + 1}-desktop.mp4`);
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("controls");
    expect(video.muted).toBe(true);
  });
  expect(videos[0]).toHaveAttribute("width", "1440");
  expect(videos[0]).toHaveAttribute("height", "1080");
  expect(container.querySelector(".v2-flight-grid .v2-placeholder")).toBeNull();
  expect(container.querySelector(".v2-flight-grid h4")).toBeNull();
  expect(container.querySelectorAll(".v2-flight-stack video")).toHaveLength(2);
  expect(container.querySelector(".v2-flight-stack .v2-flight-slot-1")).toBeNull();
  expect(container.querySelector(".v2-flight-grid")?.textContent).not.toMatch(/穿越机飞行\s*0[123]/);
  for (const video of videos) expect(video.getAttribute("aria-label")).not.toMatch(/穿越机飞行\s*0[123]/);
  expect(screen.queryByText("视频链接待补充")).not.toBeInTheDocument();
});
it("starts visible videos and suspends those outside the viewport", () => {
  render(<FlightVideo photo={portfolioContent.videos[0].video!} />);
  visibility(true);
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  const previous = vi.mocked(HTMLMediaElement.prototype.pause).mock.calls.length;
  visibility(false);
  expect(vi.mocked(HTMLMediaElement.prototype.pause).mock.calls.length).toBeGreaterThan(previous);
});

it("requests no video or poster before approaching the viewport", () => {
  render(<FlightVideo photo={portfolioContent.videos[0].video!} />);
  const video = screen.getByLabelText("右侧飞行视频");
  expect(video).not.toHaveAttribute("src");
  expect(video).not.toHaveAttribute("poster");
  expect(video).toHaveAttribute("preload", "none");
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
});

it("chooses the mobile file once and keeps it through subsequent visibility changes", () => {
  const original = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...original(query), matches: query === "(max-width: 767px)" }));
  render(<FlightVideo photo={portfolioContent.videos[0].video!} />);
  visibility(true);
  const video = screen.getByLabelText("右侧飞行视频");
  expect(video).toHaveAttribute("src", "/media/flight/optimized/v1/1-mobile.mp4");
  vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...original(query), matches: false }));
  visibility(false); visibility(true);
  expect(video).toHaveAttribute("src", "/media/flight/optimized/v1/1-mobile.mp4");
});

it("pauses while a media viewer or navigation overlay suspends the section", () => {
  const photo = portfolioContent.videos[0].video!;
  const { rerender } = render(<FlightVideo photo={photo} />);
  visibility(true);
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  rerender(<FlightVideo photo={photo} suspended />);
  expect(screen.getByLabelText("右侧飞行视频")).not.toHaveAttribute("autoplay");
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
});
it("keeps native controls without automatic playback for reduced motion", () => {
  reduced = true;
  render(<FlightVideo photo={portfolioContent.videos[0].video!} />);
  visibility(true);
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  expect(screen.getByLabelText("右侧飞行视频")).not.toHaveAttribute("autoplay");
  expect(screen.getByLabelText("右侧飞行视频")).toHaveAttribute("controls");
});
