import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WorksFloatingBackground } from "./WorksFloatingBackground";
import { emissionIntervalMs, posterLayout, posterPosition, worksBackgroundConfig as c } from "./works-background.config";
import photos from "./works-background-photos.json";

let frames: Map<number, FrameRequestCallback>;
let frameId: number;
let now: number;
function advance(ms: number, step = 10) {
  act(() => {
    const end = now + ms;
    while (now < end) {
      now = Math.min(end, now + step);
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(now));
    }
  });
}
beforeEach(() => {
  frames = new Map(); frameId = 0; now = 0;
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { frames.set(++frameId, callback); return frameId; });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => { frames.delete(id); });
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({ matches: false, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("uses all 88 lightweight images and a three-per-two-second sequential cadence", () => {
  expect(photos).toHaveLength(88);
  expect(new Set(photos.map((photo) => photo.file)).size).toBe(88);
  expect(emissionIntervalMs).toBeCloseTo(666.6667, 3);
  const { container } = render(<WorksFloatingBackground paused={false} />);
  advance(10);
  expect(container.querySelectorAll("img[src]")).toHaveLength(1);
  advance(650);
  expect(container.querySelectorAll("img[src]")).toHaveLength(1);
  advance(30);
  expect(container.querySelectorAll("img[src]")).toHaveLength(2);
  advance(660);
  expect(container.querySelectorAll("img[src]")).toHaveLength(3);
  expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  expect(container.querySelectorAll("img:not([alt=''])")).toHaveLength(0);
});

it("moves from right to left, preserves proportions and limits mounted images", () => {
  const layout = posterLayout(3, { width: 1920, height: 1080 }, 0.6);
  expect(layout.width / layout.height).toBeCloseTo(0.6);
  expect(layout.width).toBeLessThanOrEqual(c.maxWidth);
  expect(layout.height).toBeLessThanOrEqual(c.maxHeight);
  const a = posterPosition(2000, 1920, layout);
  const b = posterPosition(3000, 1920, layout);
  expect(a.x - b.x).toBeCloseTo(172.8);
  expect(a.opacity).toBeLessThanOrEqual(c.opacity);
  expect(posterPosition(30000, 1920, layout).expired).toBe(true);
  const { container, unmount } = render(<WorksFloatingBackground paused={false} />);
  advance(60000, 48);
  expect(container.querySelectorAll("img")).toHaveLength(c.poolSize);
  unmount();
  expect(frames.size).toBe(0);
});

it("freezes and resumes without advancing or issuing a catch-up burst", () => {
  const { container, rerender } = render(<WorksFloatingBackground paused={false} />);
  advance(2000);
  const image = container.querySelector("img")!;
  const transform = image.style.transform;
  const count = container.querySelectorAll("img[src]").length;
  rerender(<WorksFloatingBackground paused />);
  advance(10000);
  expect(image.style.transform).toBe(transform);
  expect(frames.size).toBe(0);
  rerender(<WorksFloatingBackground paused={false} />);
  advance(10);
  expect(image.style.transform).toBe(transform);
  expect(container.querySelectorAll("img[src]")).toHaveLength(count);
  advance(100);
  expect(image.style.transform).not.toBe(transform);
});

it("emits at most one paper after a delayed frame rather than replaying missed emissions", () => {
  const { container } = render(<WorksFloatingBackground paused={false} />);
  advance(10);
  advance(10000, 10000);
  expect(container.querySelectorAll("img[src]")).toHaveLength(2);
  advance(10);
  expect(container.querySelectorAll("img[src]")).toHaveLength(2);
});

it("waits for the main module to enter view and resumes its existing stream after leaving", () => {
  let observeVisibility: IntersectionObserverCallback;
  const disconnect = vi.fn();
  vi.spyOn(window, "IntersectionObserver").mockImplementation(class {
    constructor(callback: IntersectionObserverCallback) { observeVisibility = callback; }
    observe() {}
    unobserve() {}
    disconnect = disconnect;
    takeRecords() { return []; }
    readonly root = null;
    readonly rootMargin = "0px";
    readonly scrollMargin = "0px";
    readonly thresholds = [0];
  });
  const visible = (isIntersecting: boolean) => act(() => observeVisibility(
    [{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver,
  ));
  const { container, unmount } = render(<WorksFloatingBackground contained paused={false} />);
  advance(3000);
  expect(container.querySelectorAll("img[src]")).toHaveLength(0);
  expect(frames.size).toBe(0);
  visible(true);
  advance(2000);
  const image = container.querySelector("img")!;
  const transform = image.style.transform;
  const count = container.querySelectorAll("img[src]").length;
  visible(false);
  advance(20000);
  expect(image.style.transform).toBe(transform);
  expect(frames.size).toBe(0);
  visible(true);
  advance(10);
  expect(image.style.transform).toBe(transform);
  expect(container.querySelectorAll("img[src]")).toHaveLength(count);
  advance(100);
  expect(image.style.transform).not.toBe(transform);
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(frames.size).toBe(0);
});

it("suspends in hidden tabs and honors reduced-motion with three static papers", () => {
  const visibility = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  const first = render(<WorksFloatingBackground paused={false} />);
  advance(1000);
  visibility.mockReturnValue(true);
  act(() => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(frames.size).toBe(0);
  visibility.mockReturnValue(false);
  act(() => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(frames.size).toBe(1);
  first.unmount();
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({ matches: true, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() }));
  const second = render(<WorksFloatingBackground paused={false} />);
  expect(second.container.querySelectorAll("img[src]")).toHaveLength(3);
  expect(frames.size).toBe(0);
});
