import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { PracticePreview } from "./PracticePreview";
import { PortfolioPage } from "./PortfolioPage";
import { practiceGalleryGroups as groups } from "./practice-gallery.config";

vi.mock("./motion", () => ({ useV2Motion: () => undefined }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  vi.stubGlobal("IntersectionObserver", class {
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) { this.callback = callback; }
    observe(target: Element) { this.callback([{ target, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    disconnect() {}
  });
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } },
    close: { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); } },
  });
});
afterEach(() => {
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

it("includes all 167 supplied images in seven albums with existing full and thumbnail derivatives", () => {
  expect(new Set(groups.map((group) => group.title))).toEqual(new Set(["爱自拍", "比赛", "噜噜", "爬山", "实践", "琐碎的生活", "无人机，穿越机"]));
  const photos = groups.flatMap((group) => group.photos);
  expect(photos).toHaveLength(167);
  expect(new Set(photos.map((photo) => photo.id)).size).toBe(167);
  for (const photo of photos) {
    expect(existsSync(resolve("public", photo.src!.slice(1)))).toBe(true);
    expect(existsSync(resolve("public", photo.thumbnail!.slice(1)))).toBe(true);
    expect(photo.width).toBeGreaterThan(0);
    expect(photo.height).toBeGreaterThan(0);
  }
});

it("replaces the six blue placeholders with seven real-photo carousels in the isolated preview", () => {
  const { container } = render(<PracticePreview />);
  expect(container.querySelectorAll("main > section")).toHaveLength(1);
  expect(container.querySelector(".v2-placeholder, .v2-practice-track, #home, #experience, #projects, #life")).toBeNull();
  expect(container.querySelectorAll(".v2-document-wall")).toHaveLength(7);
  for (const group of groups) {
    const wall = screen.getByRole("region", { name: group.title });
    expect(within(wall).getByRole("img")).toHaveAttribute("src", group.photos[0].thumbnail);
  }
});

it("merges both completed modules into the four-section main site and keeps full-image viewing", () => {
  const { container } = render(<PortfolioPage />);
  expect(container.querySelectorAll("main > section")).toHaveLength(4);
  const works = screen.getByRole("region", { name: "个人作品集" });
  expect(works.querySelector(".v2-works-photo-background")).not.toBeNull();
  expect(works.querySelector(".v2-publication-card")).not.toBeNull();
  expect(works.querySelectorAll(".v2-news-entry")).toHaveLength(3);
  const practice = screen.getByRole("region", { name: "把热爱付诸实践" });
  expect(practice.querySelectorAll(".v2-document-wall")).toHaveLength(7);
  expect(practice.querySelectorAll(".v2-practice-backdrop img")).toHaveLength(12);
  expect(practice.querySelector(".v2-placeholder, .v2-practice-track")).toBeNull();
  expect(screen.queryByText("第四模块 · 独立预览")).not.toBeInTheDocument();
  fireEvent.click(within(practice).getByRole("button", { name: "放大查看比赛 01" }));
  const viewer = screen.getByRole("dialog", { name: "比赛 01" });
  expect(viewer.querySelector(".v2-viewer-panel img")).toHaveAttribute("src", groups[0].photos[0].src);
  expect(practice.querySelectorAll("button:disabled")).toHaveLength(14);
  fireEvent.click(within(viewer).getByRole("button", { name: "关闭查看" }));
  expect(practice.querySelector("button:disabled")).toBeNull();
});

it("opens the larger original derivative and shared blurred curtain instead of the wall thumbnail", () => {
  render(<PracticePreview />);
  fireEvent.click(screen.getByRole("button", { name: "放大查看比赛 01" }));
  const viewer = screen.getByRole("dialog", { name: "比赛 01" });
  const image = groups[0].photos[0];
  expect(viewer.querySelector(".v2-viewer-panel img")).toHaveAttribute("src", image.src);
  expect(viewer.querySelector(".v2-viewer-curtain img")).toHaveAttribute("src", image.src);
  fireEvent.click(within(viewer).getByRole("button", { name: "关闭查看" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("pauses all automatic changes while keeping manual browsing available", () => {
  const { container } = render(<PracticePreview />);
  fireEvent.click(screen.getByRole("button", { name: "暂停照片轮换" }));
  act(() => vi.advanceTimersByTime(20000));
  expect(container.querySelector('[data-phase="waiting"], [data-phase="incoming"]')).toBeNull();
  const next = screen.getByRole("button", { name: "比赛下一张" });
  expect(next).toBeEnabled();
  fireEvent.click(next);
  const incoming = screen.getByRole("region", { name: "比赛" }).querySelector('[data-phase="waiting"] img')!;
  fireEvent.load(incoming);
  expect(screen.getByRole("button", { name: "放大查看比赛 02" })).toBeInTheDocument();
});
