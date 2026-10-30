import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DocumentWall } from "./DocumentWall";
import { documentWallMotion } from "./document-wall.config";

const photos = ["a", "b", "c"].map((id) => ({ id, title: `荣誉 ${id}`, src: `/${id}.webp`, width: 1600, height: 1120 }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", class {
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) { this.callback = callback; }
    observe() { this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    disconnect() {}
  });
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const load = (id: string) => fireEvent.load(document.querySelector(`img[src="/${id}.webp"]`)!);
const advance = (milliseconds: number) => act(() => vi.advanceTimersByTime(milliseconds));

it("does not request the current image or neighbours for a distant wall", () => {
  let enter: IntersectionObserverCallback;
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { enter = callback; }
    observe() {}
    disconnect() {}
  });
  const preload = vi.spyOn(window, "Image");
  const { container } = render(<DocumentWall photos={photos} title="荣誉" onView={() => {}} />);
  expect(container.querySelector("img")).toBeNull();
  expect(preload).not.toHaveBeenCalled();
  act(() => enter([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
  expect(container.querySelector("img")).toHaveAttribute("src", "/a.webp");
  expect(preload).not.toHaveBeenCalled(); // Near loading does not start neighbour prefetch.
});

it("accepts a longer gallery dwell without changing the honors default", () => {
  const { container } = render(<DocumentWall photos={photos} title="比赛" onView={() => {}} intervalMs={4500} />);
  advance(4499);
  expect(container.querySelector('[data-phase="waiting"]')).toBeNull();
  advance(1);
  expect(container.querySelector('[data-phase="waiting"] img')).toHaveAttribute("src", "/b.webp");
  load("b");
  advance(documentWallMotion.duration);
  advance(4499);
  expect(container.querySelectorAll(".v2-document-layer")).toHaveLength(1);
  advance(1);
  expect(container.querySelector('[data-phase="waiting"] img')).toHaveAttribute("src", "/c.webp");
});

it.each(["荣誉", "证书"])("waits a full 1.5 seconds after the %s dissolve finishes", (title) => {
  const { container } = render(<DocumentWall photos={photos} title={title} onView={() => {}} />);
  advance(1499);
  expect(container.querySelector('[data-phase="waiting"]')).toBeNull();
  advance(1);
  expect(container.querySelector('[data-phase="waiting"] img')).toHaveAttribute("src", "/b.webp");
  load("b");
  advance(documentWallMotion.duration - 1);
  expect(container.querySelectorAll(".v2-document-layer")).toHaveLength(2);
  advance(1);
  expect(container.querySelectorAll(".v2-document-layer")).toHaveLength(1);
  advance(1499);
  expect(container.querySelectorAll(".v2-document-layer")).toHaveLength(1);
  expect(screen.getByRole("img")).toHaveAttribute("src", "/b.webp");
  advance(1);
  expect(container.querySelector('[data-phase="waiting"] img')).toHaveAttribute("src", "/c.webp");
});
it("does not count image loading time as part of the post-dissolve dwell", () => {
  const { container } = render(<DocumentWall photos={photos} title="荣誉" onView={() => {}} />);
  advance(documentWallMotion.interval);
  advance(5000);
  expect(screen.getByRole("img")).toHaveAttribute("src", "/a.webp");
  load("b");
  advance(documentWallMotion.duration);
  advance(1499);
  expect(container.querySelectorAll(".v2-document-layer")).toHaveLength(1);
  advance(1);
  expect(container.querySelector('[data-phase="waiting"] img')).toHaveAttribute("src", "/c.webp");
});
it("starts a new dwell after manual browsing, cancelling the old autoplay deadline", () => {
  const { container } = render(<DocumentWall photos={photos} title="荣誉" onView={() => {}} />);
  advance(500);
  fireEvent.click(screen.getByRole("button", { name: "荣誉下一张" }));
  load("b");
  advance(documentWallMotion.duration);
  expect(container.querySelectorAll(".v2-document-layer")).toHaveLength(1);
  advance(1499);
  expect(screen.getByRole("img")).toHaveAttribute("src", "/b.webp");
  advance(1);
  expect(container.querySelector('[data-phase="waiting"] img')).toHaveAttribute("src", "/c.webp");
});

it("holds the original until the new image loads, then crossfades only two layers", () => {
  const { container } = render(<DocumentWall photos={photos} title="荣誉" onView={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "荣誉下一张" }));
  expect(screen.getByRole("img")).toHaveAttribute("src", "/a.webp");
  expect(container.querySelector('[data-phase="waiting"] img')).toHaveAttribute("src", "/b.webp");
  expect(container.querySelectorAll(".v2-document-layer")).toHaveLength(2);
  load("b");
  expect(screen.getByRole("img")).toHaveAttribute("src", "/b.webp");
  expect(container.querySelector('[data-phase="outgoing"]')).toHaveAttribute("aria-hidden", "true");
  expect(container.querySelector('[data-phase="incoming"]')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(documentWallMotion.duration));
  expect(container.querySelectorAll(".v2-document-layer")).toHaveLength(1);
});
it("coalesces rapid navigation without accumulating image layers", () => {
  const { container } = render(<DocumentWall photos={photos} title="荣誉" onView={() => {}} />);
  const next = screen.getByRole("button", { name: "荣誉下一张" });
  fireEvent.click(next); load("b"); fireEvent.click(next);
  expect(container.querySelectorAll(".v2-document-layer")).toHaveLength(2);
  act(() => vi.advanceTimersByTime(documentWallMotion.duration));
  load("c");
  expect(screen.getByRole("img")).toHaveAttribute("src", "/c.webp");
  act(() => vi.advanceTimersByTime(documentWallMotion.duration));
  expect(container.querySelectorAll(".v2-document-layer")).toHaveLength(1);
});
it("keeps image enlargement and keyboard navigation while removing the footer UI", () => {
  const onView = vi.fn();
  const { container } = render(<DocumentWall photos={photos} title="荣誉" onView={onView} />);
  expect(container.querySelector(".v2-wall-bottom, .v2-wall-note, .v2-controls")).toBeNull();
  expect(screen.getByRole("button", { name: "荣誉上一张" })).toHaveClass("arrow-left");
  fireEvent.keyDown(screen.getByRole("button", { name: "放大查看荣誉 a" }), { key: "ArrowLeft" });
  load("c");
  fireEvent.click(screen.getByRole("button", { name: "放大查看荣誉 c" }));
  expect(onView).toHaveBeenCalledWith(photos[2]);
});
it("completes a failed load into the existing fallback instead of leaving a stuck transition", () => {
  const { container } = render(<DocumentWall photos={photos} title="荣誉" onView={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "荣誉下一张" }));
  fireEvent.error(container.querySelector('img[src="/b.webp"]')!);
  expect(screen.getByRole("img", { name: "荣誉 b，蓝色图片占位" })).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(documentWallMotion.duration));
  expect(container.querySelectorAll(".v2-document-layer")).toHaveLength(1);
});
