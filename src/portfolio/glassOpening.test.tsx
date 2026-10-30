import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PortfolioPage } from "./PortfolioPage";
import { openingDuration, openingStorageKey } from "./motion";

beforeEach(() => localStorage.clear());
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); });

it("starts the opening before paint and releases its layers after the bounded sequence", () => {
  vi.useFakeTimers();
  const { container, unmount } = render(<PortfolioPage />);
  const root = container.querySelector(".portfolio-v2")!;
  expect(root).toHaveAttribute("data-opening", "playing");
  expect(root.querySelectorAll(".v2-glass-shutter")).toHaveLength(2);
  act(() => vi.advanceTimersByTime(openingDuration - 1));
  expect(root).toHaveAttribute("data-opening", "playing");
  act(() => vi.advanceTimersByTime(1));
  expect(root).toHaveAttribute("data-opening", "complete");
  expect(localStorage.getItem(openingStorageKey)).toBe("1");
  unmount();
});

it("skips the opening on a repeat visit in the same browser", () => {
  localStorage.setItem(openingStorageKey, "1");
  const { container } = render(<PortfolioPage />);
  expect(container.querySelector(".portfolio-v2")).toHaveAttribute("data-opening", "complete");
});

it("still releases content when local storage is blocked", () => {
  vi.useFakeTimers();
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked"); });
  const { container } = render(<PortfolioPage />);
  act(() => vi.advanceTimersByTime(openingDuration));
  expect(container.querySelector(".portfolio-v2")).toHaveAttribute("data-opening", "complete");
});

it("shows content directly when reduced motion is requested", () => {
  const original = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...original(query), matches: query.includes("prefers-reduced-motion") }));
  const { container } = render(<PortfolioPage />);
  expect(container.querySelector(".portfolio-v2")).toHaveAttribute("data-opening", "complete");
});
