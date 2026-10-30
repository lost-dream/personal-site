import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { WorksPhotoBackground } from "./WorksPhotoBackground";
import { expandWorksMosaicPhoto, layoutWorksMosaic, orderWorksMosaicPhotos, worksMosaicConfig as config } from "./works-photo-mosaic";
import photos from "./works-mosaic-photos.json";
import { readFileSync } from "node:fs";

const videoCss = readFileSync("src/portfolio/flight-videos.css", "utf8");
const backgroundCss = readFileSync("src/portfolio/works-photo-background.css", "utf8");

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it.each([[1920, 4200], [1280, 4000], [375, 8500]])("fills a %ipx wide section with proportional justified rows", (width, height) => {
  const tiles = layoutWorksMosaic(orderWorksMosaicPhotos(photos), width, height);
  expect(tiles.length).toBeGreaterThan(0);
  const rows = [...new Set(tiles.map((tile) => tile.y))];
  rows.forEach((y, index) => {
    const row = tiles.filter((tile) => tile.y === y);
    expect(row[0].x).toBe(0);
    expect(row.at(-1)!.x + row.at(-1)!.width).toBeCloseTo(width);
    row.forEach((tile, i) => {
      expect(tile.width).toBeGreaterThan(0);
      expect(tile.width / tile.height).toBeCloseTo(tile.photo.width / tile.photo.height);
      if (i > 0) expect(tile.x - (row[i - 1].x + row[i - 1].width)).toBeCloseTo(config.gapPx);
    });
    if (index > 0) {
      const previous = tiles.find((tile) => tile.y === rows[index - 1])!;
      expect(y - previous.y - previous.height).toBeCloseTo(config.gapPx);
    }
  });
  const last = tiles.at(-1)!;
  expect(last.y + last.height).toBeGreaterThanOrEqual(height);
});

it("uses 48 real local images with stable mixed order and no mutation", () => {
  expect(photos).toHaveLength(48);
  const before = photos.map((photo) => photo.file);
  const ordered = orderWorksMosaicPhotos(photos);
  expect(orderWorksMosaicPhotos(photos)).toEqual(ordered);
  expect(ordered).not.toEqual(photos);
  expect(new Set(ordered.map((photo) => photo.file)).size).toBe(48);
  expect(photos.map((photo) => photo.file)).toEqual(before);
  expect(layoutWorksMosaic([], 1280, 4000)).toEqual([]);
  expect(layoutWorksMosaic(photos, 0, 4000)).toEqual([]);
});

it("removes gaps and proportionally bleeds photos past every cell to hide feather seams", () => {
  expect(config.gapPx).toBe(0);
  expect(config.featherPx).toBe(5);
  expect(config.bleedPx).toBe(12);
  for (const viewport of [[1920, 4200], [1280, 4000], [375, 8500]]) {
    for (const tile of layoutWorksMosaic(photos, viewport[0], viewport[1])) {
      const frame = expandWorksMosaicPhoto(tile);
      expect(frame.width / frame.height).toBeCloseTo(tile.width / tile.height);
      expect(tile.x - frame.x).toBeGreaterThanOrEqual(config.bleedPx - 0.001);
      expect(tile.y - frame.y).toBeGreaterThanOrEqual(config.bleedPx - 0.001);
      expect(frame.x + frame.width - tile.x - tile.width).toBeGreaterThanOrEqual(config.bleedPx - 0.001);
      expect(frame.y + frame.height - tile.y - tile.height).toBeGreaterThanOrEqual(config.bleedPx - 0.001);
    }
  }
});

it("is decorative, section-local, uses 5px feathering and cleans up resize observation", () => {
  let notify: ResizeObserverCallback;
  const disconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) { notify = callback; }
    observe() {}
    disconnect = disconnect;
  });
  const { container, unmount } = render(<WorksPhotoBackground />);
  const root = container.firstElementChild!;
  expect(root).toHaveAttribute("aria-hidden", "true");
  expect(root).toHaveStyle({ "--works-photo-feather": "5px" });
  expect(container.querySelector("button, a, video")).toBeNull();
  expect(container.querySelectorAll("img:not([alt=''])")).toHaveLength(0);
  const first = container.querySelector("img")!;
  expect(first.src).toContain("/media/works-mosaic/");
  const oldWidth = first.style.width;
  act(() => notify!([{ contentRect: { width: 375, height: 8500 } } as ResizeObserverEntry], {} as ResizeObserver));
  expect(first.style.width).not.toBe(oldWidth);
  expect(backgroundCss).toContain("pointer-events: none");
  expect(backgroundCss).toContain("mask-composite: intersect");
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});

it("sets video opacity to 50%, hover/keyboard focus to 85%, and only transitions opacity", () => {
  expect(videoCss).toMatch(/--flight-opacity:\s*0\.5\s*;/);
  expect(videoCss).toMatch(/--flight-hover-opacity:\s*0\.85\s*;/);
  expect(videoCss).toContain(".v2-flight-media:is(:hover, :focus-within)");
  expect(videoCss).toContain("transition: opacity");
  expect(videoCss).toContain("prefers-reduced-motion: reduce");
});
