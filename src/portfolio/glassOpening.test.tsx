import { useRef } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PortfolioPage } from "./PortfolioPage";
import { useGlassOpening, openingDuration, openingHoldDuration } from "./useGlassOpening";

function Opening() {
  const root = useRef<HTMLDivElement>(null);
  const remaining = useGlassOpening(root);
  return <div ref={root} data-testid="page" data-opening="pending">
    <div className="v2-glass-opening"><span data-testid="seconds">{remaining}</span></div>
    <main>正文</main>
  </div>;
}
beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); });

it("holds eight seconds, counts down and restores browsing after the reveal", () => {
  const { container } = render(<Opening />);
  const root = screen.getByTestId("page");
  expect(root).toHaveAttribute("data-opening", "holding");
  expect(screen.getByTestId("seconds")).toHaveTextContent("8");
  expect(container.querySelector("main")).toHaveAttribute("inert");
  act(() => vi.advanceTimersByTime(3000));
  expect(screen.getByTestId("seconds")).toHaveTextContent("5");
  act(() => vi.advanceTimersByTime(openingHoldDuration - 3000));
  expect(root).toHaveAttribute("data-opening", "playing");
  expect(screen.getByTestId("seconds")).toHaveTextContent("0");
  act(() => vi.advanceTimersByTime(openingDuration - openingHoldDuration));
  expect(root).toHaveAttribute("data-opening", "complete");
  expect(container.querySelector("main")).not.toHaveAttribute("inert");
  expect(document.body.style.overflow).not.toBe("hidden");
});

it("uses eight seconds even when the old seen flag is present", () => {
  localStorage.setItem("csy:opening-seen:v1", "1");
  render(<Opening />);
  expect(screen.getByTestId("page")).toHaveAttribute("data-opening", "holding");
});

it("catches up after a background tab instead of waiting for delayed ticks", () => {
  render(<Opening />);
  act(() => {
    vi.setSystemTime(Date.now() + openingDuration + 5000);
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(screen.getByTestId("page")).toHaveAttribute("data-opening", "complete");
});

it("cleans up timers and restores existing scroll styles when unmounted early", () => {
  const previous = document.body.style.overflow;
  document.body.style.overflow = "auto";
  const { unmount } = render(<Opening />);
  unmount();
  expect(document.body.style.overflow).toBe("auto");
  expect(vi.getTimerCount()).toBe(0);
  document.body.style.overflow = previous;
});

it("renders the actual frosted countdown from the first page frame", () => {
  const { container } = render(<PortfolioPage />);
  expect(container.querySelector(".portfolio-v2")).toHaveAttribute("data-opening", "holding");
  expect(container.querySelectorAll(".v2-glass-shutter")).toHaveLength(2);
  expect(screen.getByRole("timer", { name: "网站开启倒计时" })).toHaveTextContent("08s");
});
