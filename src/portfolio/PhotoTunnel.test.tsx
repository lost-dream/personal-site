import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PhotoTunnel, tunnelMotionKey, tunnelSpeedKey } from "./PhotoTunnel";
import { heroEffects } from "./hero-effects.config";

const photos = Array.from({ length: 30 }, (_, i) => ({ id: `photo-${i}`, title: `照片 ${i}`, src: `/full-${i}.webp`, thumbnail: `/thumb-${i}.webp`, mobileThumbnail: `/mobile-${i}.webp`, width: 1200, height: 1600 }));
let nextFrame: FrameRequestCallback;
let now: number;
const advance = (frames = 90) => act(() => {
  for (let index = 0; index < frames; index++) { now += 1000 / 60; nextFrame(now); }
});
const readTravel = () => Number(screen.getByLabelText("螺旋照片隧道").getAttribute("data-travel"));

beforeEach(() => {
  localStorage.removeItem(tunnelMotionKey);
  localStorage.removeItem(tunnelSpeedKey);
  now = performance.now();
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { nextFrame = callback; return 1; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("IntersectionObserver", class {
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) { this.callback = callback; }
    observe() { this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    disconnect() {}
  });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.removeItem(tunnelMotionKey); localStorage.removeItem(tunnelSpeedKey); });

describe("photo tunnel interaction", () => {
  it("changes actual mobile travel by ten percentage points per click without jumping, and remembers the speed", () => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...original(query), matches: query.includes("max-width") }));
    const firstRender = render(<PhotoTunnel photos={photos} onView={() => {}} />);
    expect(screen.queryByRole("button", { name: "查看下一组隧道照片" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("当前隧道速度")).toHaveTextContent("100%");
    advance(180);
    const position = readTravel();
    fireEvent.click(screen.getByRole("button", { name: "加速10%" }));
    expect(readTravel()).toBe(position);
    expect(screen.getByLabelText("当前隧道速度")).toHaveTextContent("110%");
    advance(120);
    const fast = readTravel();
    advance(60);
    expect(readTravel() - fast).toBeCloseTo(132, 0);
    fireEvent.click(screen.getByRole("button", { name: "加速10%" }));
    expect(screen.getByLabelText("当前隧道速度")).toHaveTextContent("120%");
    advance(120);
    const faster = readTravel();
    advance(60);
    expect(readTravel() - faster).toBeCloseTo(144, 0);
    fireEvent.click(screen.getByRole("button", { name: "减速10%" }));
    expect(screen.getByLabelText("当前隧道速度")).toHaveTextContent("110%");
    expect(localStorage.getItem(tunnelSpeedKey)).toBe("110");
    firstRender.unmount();
    render(<PhotoTunnel photos={photos} onView={() => {}} />);
    expect(screen.getByLabelText("当前隧道速度")).toHaveTextContent("110%");
  });
  it("bounds mobile speed without allowing zero or negative travel", () => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...original(query), matches: query.includes("max-width") }));
    render(<PhotoTunnel photos={photos} onView={() => {}} />);
    for (let i = 0; i < 25; i++) fireEvent.click(screen.getByRole("button", { name: "加速10%" }));
    expect(screen.getByRole("button", { name: "加速10%" })).toBeDisabled();
    expect(screen.getByLabelText("当前隧道速度")).toHaveTextContent("300%");
    for (let i = 0; i < 35; i++) fireEvent.click(screen.getByRole("button", { name: "减速10%" }));
    expect(screen.getByRole("button", { name: "减速10%" })).toBeDisabled();
    expect(screen.getByLabelText("当前隧道速度")).toHaveTextContent("10%");
  });
  it("can adjust speed while paused or storage is blocked without starting motion", () => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...original(query), matches: query.includes("max-width") || query.includes("prefers-reduced-motion") }));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked"); });
    render(<PhotoTunnel photos={photos} onView={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "加速10%" }));
    expect(screen.getByLabelText("当前隧道速度")).toHaveTextContent("110%");
    expect(screen.getByRole("region", { name: "首页照片墙" })).toHaveAttribute("data-motion", "paused");
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
  it("keeps desktop travel at the original speed even when a mobile speed is saved", () => {
    localStorage.setItem(tunnelSpeedKey, "200");
    render(<PhotoTunnel photos={photos} onView={() => {}} />);
    expect(screen.queryByRole("button", { name: "加速10%" })).not.toBeInTheDocument();
    advance(180);
    const start = readTravel();
    advance(60);
    expect(readTravel() - start).toBeCloseTo(120, 0);
  });
  it.each(["max-width", "prefers-reduced-data"])("keeps depth motion with small images for %s", (preference) => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...original(query), matches: query.includes(preference) }));
    const onView = vi.fn();
    render(<PhotoTunnel photos={photos} onView={onView} />);
    const region = screen.getByRole("region", { name: "首页照片墙" });
    expect(region).not.toHaveAttribute("data-static");
    expect(region).toHaveAttribute("data-quality", "mobile");
    expect(screen.getAllByRole("img")[0]).toHaveAttribute("src", "/mobile-0.webp");
    expect(region.querySelectorAll(".v2-tunnel-photo")).toHaveLength(20);
    expect(region.querySelectorAll("canvas")).toHaveLength(2);
    advance();
    expect(readTravel()).toBeGreaterThan(100);
    fireEvent.click(screen.getAllByRole("button", { name: /放大查看照片/ })[0]);
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ src: expect.stringMatching(/^\/full-/) }));
  });
  it("has no visible tools and applies the requested image treatment", () => {
    render(<PhotoTunnel photos={photos} onView={() => {}} />);
    const region = screen.getByRole("region", { name: "首页照片墙" });
    expect(region.querySelector("details, input, .v2-controls, .v2-tunnel-bottom")).toBeNull();
    expect(screen.queryByText("螺旋影像档案")).not.toBeInTheDocument();
    expect(region.style.getPropertyValue("--tunnel-photo-opacity")).toBe("0.8");
    expect(parseFloat(region.style.getPropertyValue("--tunnel-feather"))).toBeCloseTo(6 * 760 / 1086);
    expect(parseFloat(region.style.getPropertyValue("--tunnel-photo-radius"))).toBeCloseTo(16 * 760 / 1086);
    expect(heroEffects.tunnel).toMatchObject({ autoSpeed: 120, depthGap: 300, angleStep: 50, visibleCount: 20, wheelSensitivity: 1.5, smoothing: 0.07 });
    expect(heroEffects.border).toMatchObject({ thickness: 1.5, speed: 0.4, radius: 30, spread: 25 });
  });
  it("fades the recycled center photo in over one active second", () => {
    render(<PhotoTunnel photos={photos} onView={() => {}} />);
    expect(screen.getByRole("region", { name: "首页照片墙" }).querySelectorAll(".v2-tunnel-photo")).toHaveLength(20);
    advance(170);
    const incoming = document.querySelector<HTMLButtonElement>('.v2-tunnel-photo[data-ordinal="20"]')!;
    expect(incoming).not.toBeNull();
    expect(Number(incoming.style.opacity)).toBe(0);
    advance(30);
    expect(Number(incoming.style.opacity)).toBeGreaterThan(0.45);
    expect(Number(incoming.style.opacity)).toBeLessThan(0.65);
    advance(35);
    expect(Number(incoming.style.opacity)).toBe(1);
  });
  it("fades the outer photo before recycling and keeps it on top", () => {
    render(<PhotoTunnel photos={photos} onView={() => {}} />);
    advance(135);
    const outgoing = document.querySelector<HTMLButtonElement>('.v2-tunnel-photo[data-ordinal="0"]')!;
    expect(Number(outgoing.style.zIndex)).toBe(21);
    expect(Number(outgoing.style.opacity)).toBeLessThan(1);
    advance(22);
    expect(Number(outgoing.style.opacity)).toBeLessThan(0.2);
  });
  it("auto advances, stops auto on hover, and reverses the wheel", () => {
    render(<PhotoTunnel photos={photos} onView={() => {}} />);
    advance();
    expect(readTravel()).toBeGreaterThan(100);
    const moving = readTravel();
    advance(60);
    expect(readTravel() - moving).toBeCloseTo(120, 0);
    const region = screen.getByRole("region", { name: "首页照片墙" });
    fireEvent.pointerEnter(region, { pointerType: "mouse" });
    advance();
    const stopped = readTravel();
    advance(30);
    expect(readTravel() - stopped).toBeLessThan(0.2);
    fireEvent.wheel(screen.getByLabelText("螺旋照片隧道"), { deltaY: -120 });
    advance();
    expect(readTravel()).toBeGreaterThan(stopped + 170);
    fireEvent.wheel(screen.getByLabelText("螺旋照片隧道"), { deltaY: 120 });
    advance();
    expect(readTravel()).toBeCloseTo(stopped, 0);
  });
  it("keeps the first focused keyboard step and opens the full image", () => {
    const onView = vi.fn();
    render(<PhotoTunnel photos={photos} onView={onView} />);
    const stage = screen.getByLabelText("螺旋照片隧道");
    fireEvent.focus(stage);
    fireEvent.keyDown(stage, { key: "ArrowUp" });
    advance();
    expect(readTravel()).toBeGreaterThan(290);
    const visiblePhoto = screen.getAllByRole("button", { name: /放大查看照片/ })[0];
    fireEvent.click(visiblePhoto);
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ src: expect.stringMatching(/^\/full-/) }));
  });
  it("preserves depth with no automatic motion and lets reduced-motion visitors reach the archive", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({ matches: query.includes("prefers-reduced-motion"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
    render(<PhotoTunnel photos={photos} onView={() => {}} />);
    const region = screen.getByRole("region", { name: "首页照片墙" });
    expect(region).toHaveAttribute("data-motion", "paused");
    expect(region).not.toHaveAttribute("data-static");
    expect(screen.getAllByRole("button", { name: /放大查看照片/ })).toHaveLength(20);
    expect((region.querySelector(".v2-tunnel-photo") as HTMLElement).style.transform).toContain("translate3d");
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "查看下一组隧道照片" }));
    expect(screen.getByRole("button", { name: "放大查看照片 29" })).toBeInTheDocument();
    expect(Number((region.querySelector(".v2-tunnel-photo") as HTMLElement).style.opacity)).toBe(1);
    const wheel = new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true });
    fireEvent(screen.getByLabelText("螺旋照片隧道"), wheel);
    expect(wheel.defaultPrevented).toBe(false);
  });
  it("plays on explicit request despite reduced motion, remembers it, and lets the visitor pause", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(query => ({ matches: query.includes("prefers-reduced-motion"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
    const firstRender = render(<PhotoTunnel photos={photos} onView={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "播放纵深隧道" }));
    expect(screen.getByRole("region", { name: "首页照片墙" })).toHaveAttribute("data-motion", "playing");
    advance();
    expect(readTravel()).toBeGreaterThan(100);
    expect(localStorage.getItem(tunnelMotionKey)).toBe("play");
    firstRender.unmount();
    render(<PhotoTunnel photos={photos} onView={() => {}} />);
    expect(screen.getByRole("region", { name: "首页照片墙" })).toHaveAttribute("data-motion", "playing");
    fireEvent.click(screen.getByRole("button", { name: "暂停纵深隧道" }));
    expect(screen.getByRole("region", { name: "首页照片墙" })).toHaveAttribute("data-motion", "paused");
    expect(localStorage.getItem(tunnelMotionKey)).toBe("pause");
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
  it("keeps the playback control usable if storage writes are blocked", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(query => ({ matches: query.includes("prefers-reduced-motion"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked"); });
    render(<PhotoTunnel photos={photos} onView={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "播放纵深隧道" }));
    advance();
    expect(readTravel()).toBeGreaterThan(100);
  });
});
