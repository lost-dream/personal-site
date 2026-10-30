import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { FlightVideo } from "./FlightVideo";

const player = vi.hoisted(() => ({ create: vi.fn(), attach: vi.fn(), load: vi.fn(), start: vi.fn(), stop: vi.fn(), destroy: vi.fn(),
  error: undefined as undefined | ((event: string, data: { fatal: boolean }) => void) }));
vi.mock("hls.js/light", () => ({ default: class {
  static isSupported = () => true;
  static Events = { ERROR: "error" };
  constructor(config: unknown) { player.create(config); }
  attachMedia = player.attach; loadSource = player.load; startLoad = player.start; stopLoad = player.stop; destroy = player.destroy;
  on(_event: string, callback: typeof player.error) { player.error = callback; }
} }));
let reduced = false;
vi.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => reduced }));
const callbacks = new Map<string, IntersectionObserverCallback>();
const photo = { id: "flight", title: "飞行视频", src: "/fallback.mp4", hlsSrc: "/desktop/index.m3u8", mobileHlsSrc: "/mobile/index.m3u8" };
const enter = async (key: string, isIntersecting = true) => act(async () => {
  callbacks.get(key)?.([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
});
beforeEach(() => {
  reduced = false; callbacks.clear(); vi.clearAllMocks(); player.error = undefined;
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, "canPlayType").mockReturnValue("");
  vi.stubGlobal("MediaSource", class {});
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) { callbacks.set(options?.rootMargin ? "near" : "visible", callback); }
    observe() {} disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("prefers native HLS on supporting browsers, loading nothing until near", async () => {
  vi.stubGlobal("MediaSource", undefined);
  vi.mocked(HTMLMediaElement.prototype.canPlayType).mockReturnValue("probably");
  render(<FlightVideo photo={photo} />);
  expect(screen.getByLabelText("飞行视频")).not.toHaveAttribute("src");
  await enter("near");
  expect(screen.getByLabelText("飞行视频")).toHaveAttribute("src", "/desktop/index.m3u8");
  expect(player.create).not.toHaveBeenCalled();
});

it("loads the small player only near and starts/stops segment requests with visibility", async () => {
  const { unmount } = render(<FlightVideo photo={photo} />);
  expect(player.create).not.toHaveBeenCalled();
  await enter("near");
  expect(player.load).toHaveBeenCalledWith("/desktop/index.m3u8");
  expect(player.start).not.toHaveBeenCalled();
  await enter("visible");
  expect(player.start).toHaveBeenCalled();
  await enter("visible", false);
  expect(player.stop).toHaveBeenCalled();
  unmount(); expect(player.destroy).toHaveBeenCalledTimes(1);
});

it("keeps manual playback usable when automatic motion is reduced", async () => {
  reduced = true;
  render(<FlightVideo photo={photo} />);
  await enter("near"); await enter("visible");
  expect(player.start).not.toHaveBeenCalled();
  fireEvent.play(screen.getByLabelText("飞行视频"));
  expect(player.start).toHaveBeenCalled();
  expect(screen.getByLabelText("飞行视频")).not.toHaveAttribute("autoplay");
});

it("falls back to the MP4 and preserves controls after a fatal stream failure", async () => {
  render(<FlightVideo photo={photo} />);
  await enter("near"); await enter("visible");
  act(() => player.error?.("error", { fatal: true }));
  expect(screen.getByLabelText("飞行视频")).toHaveAttribute("src", "/fallback.mp4");
  expect(screen.getByLabelText("飞行视频")).toHaveAttribute("controls");
  expect(player.destroy).toHaveBeenCalledTimes(1);
});
