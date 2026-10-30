import { useEffect, useRef, type RefObject } from "react";
import { createFloatWorld, stepFloatWorld, type FloatBody } from "./floatPhysics";

// Conservative, fixed collision envelopes contain every photo ratio, even during
// image swaps. Only transforms change per frame; React never renders a physics tick.
export function useFloatingWall(
  root: RefObject<HTMLDivElement | null>, enabled: boolean, count: number, moving: boolean,
) {
  const controller = useRef<{ setRunning(value: boolean): void } | null>(null);
  const running = useRef(moving);
  useEffect(() => {
    running.current = moving;
    controller.current?.setRunning(moving);
  }, [moving]);
  useEffect(() => {
    const arena = root.current?.querySelector<HTMLElement>(".v2-wall-tiles");
    if (!enabled || !arena || !count || typeof ResizeObserver === "undefined") return;
    const tiles = Array.from(arena.querySelectorAll<HTMLElement>(".v2-wall-tile"));
    let bodies: FloatBody[] = [];
    let width = 0, height = 0, frame = 0, previous = 0, time = 0;
    let pinned = -1;
    let active = running.current;
    const paint = () => bodies.forEach((body, index) => {
      tiles[index].style.transform = `translate3d(${body.x + 12}px, ${body.y + 12}px, 0)`;
    });
    const tick = (now: number) => {
      frame = 0;
      if (!active || !bodies.length) return;
      const dt = previous ? Math.min((now - previous) / 1000, 1 / 30) : 0;
      previous = now;
      time += dt;
      stepFloatWorld(bodies, width, height, dt, time, pinned);
      paint();
      frame = requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (active && bodies.length && !frame) frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const nextWidth = arena.clientWidth - 24, nextHeight = arena.clientHeight - 24;
      if (nextWidth <= 0 || nextHeight <= 0 || (width === nextWidth && height === nextHeight)) return;
      width = nextWidth; height = nextHeight;
      bodies = createFloatWorld(width, height, tiles.length);
      arena.dataset.floating = "true";
      bodies.forEach((body, index) => {
        tiles[index].style.width = `${body.width}px`;
        tiles[index].style.height = `${body.height}px`;
      });
      paint();
      schedule();
    };
    const disposers = tiles.map((tile, index) => {
      const enter = (event: PointerEvent) => { if (event.pointerType !== "touch") pinned = index; };
      const leave = () => { if (pinned === index) pinned = -1; };
      tile.addEventListener("pointerenter", enter);
      tile.addEventListener("pointerleave", leave);
      return () => {
        tile.removeEventListener("pointerenter", enter);
        tile.removeEventListener("pointerleave", leave);
      };
    });
    controller.current = {
      setRunning(value) {
        active = value;
        previous = 0;
        if (!active && frame) { cancelAnimationFrame(frame); frame = 0; }
        schedule();
      },
    };
    const observer = new ResizeObserver(resize);
    observer.observe(arena);
    resize();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      disposers.forEach(dispose => dispose());
      delete arena.dataset.floating;
      tiles.forEach(tile => {
        tile.style.removeProperty("width");
        tile.style.removeProperty("height");
        tile.style.removeProperty("transform");
      });
      controller.current = null;
    };
  }, [root, enabled, count]);
}
