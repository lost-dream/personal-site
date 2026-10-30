import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { useFloatingWall } from "./useFloatingWall";

function Harness({ moving = true, enabled = true }) {
  const root = useRef<HTMLDivElement>(null);
  useFloatingWall(root, enabled, 2, moving);
  return <div ref={root}><div className="v2-wall-tiles">
    <button className="v2-wall-tile">one</button>
    <button className="v2-wall-tile">two</button>
  </div></div>;
}

let callbacks: Map<number, FrameRequestCallback>;
let nextId: number;
beforeEach(() => {
  callbacks = new Map(); nextId = 0;
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(660);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(600);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callbacks.set(++nextId, callback); return nextId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => callbacks.delete(id));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function advance(time: number) {
  act(() => {
    const pending = [...callbacks.values()]; callbacks.clear();
    pending.forEach(callback => callback(time));
  });
}

it("moves with time, preserves positions while paused, and cancels on unmount", () => {
  const { container, rerender, unmount } = render(<Harness />);
  const tile = container.querySelector<HTMLElement>("button")!;
  const start = tile.style.transform;
  advance(100); advance(116);
  expect(tile.style.transform).not.toBe(start);
  rerender(<Harness moving={false} />);
  const paused = tile.style.transform;
  expect(callbacks.size).toBe(0);
  advance(5000);
  expect(tile.style.transform).toBe(paused);
  rerender(<Harness />);
  advance(6000); advance(6016);
  expect(tile.style.transform).not.toBe(paused);
  unmount();
  expect(callbacks.size).toBe(0);
  expect(tile.style.transform).toBe("");
});

it("pins only the hovered photo and restores static layout when disabled", () => {
  const { container, rerender } = render(<Harness />);
  const tiles = container.querySelectorAll<HTMLElement>("button");
  const positions = [...tiles].map(tile => tile.style.transform);
  const enter = new Event("pointerenter");
  Object.defineProperty(enter, "pointerType", { value: "mouse" });
  act(() => tiles[0].dispatchEvent(enter));
  advance(100); advance(116);
  expect(tiles[0].style.transform).toBe(positions[0]);
  expect(tiles[1].style.transform).not.toBe(positions[1]);
  rerender(<Harness enabled={false} />);
  expect(container.querySelector("[data-floating]")).toBeNull();
  expect(tiles[0].style.width).toBe("");
  expect(callbacks.size).toBe(0);
});
