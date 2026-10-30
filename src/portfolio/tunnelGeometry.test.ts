import { describe, expect, it } from "vitest";
import { fadeProgress, projectTunnel, spiralPoint, wheelTravel, wrapPhotoIndex } from "./tunnelGeometry";
import { heroEffects } from "./hero-effects.config";

const items = Array.from({ length: 20 }, (_, ordinal) => ({ ordinal, width: 180, height: 240 }));
describe("approved galaxy tunnel geometry", () => {
  it("reverses the wheel and normalizes lines/pages", () => {
    expect(wheelTravel(-120, 0, 620)).toBe(180);
    expect(wheelTravel(120, 0, 620)).toBe(-180);
    expect(wheelTravel(-3, 1, 620)).toBeCloseTo(72);
    expect(wheelTravel(-1, 2, 620)).toBe(480);
    expect(wheelTravel(-10000, 0, 620)).toBe(480);
  });
  it("wraps forward and backward through every photo", () => {
    expect(wrapPhotoIndex(-1, 269)).toBe(268);
    expect(wrapPhotoIndex(269, 269)).toBe(0);
    expect(wrapPhotoIndex(538, 269)).toBe(0);
    expect(wrapPhotoIndex(1, 0)).toBe(0);
  });
  it("matches the latest standalone reference curves exactly", () => {
    const placed = projectTunnel(items, 137, 1086, 1000);
    placed.forEach((p) => {
      const rank = p.ordinal - 137 / 300;
      const remaining = 1 - Math.max(0, Math.min(1, rank / 19));
      const radius = 0.18 + 0.82 * remaining ** 1.4 + (rank < 0 ? 0.16 * (-rank) ** 1.6 : 0);
      const angle = (-90 - rank * 50) * Math.PI / 180;
      expect(p.scale).toBeCloseTo(0.15 + 0.85 * remaining ** 3, 10);
      expect(p.x).toBeCloseTo(Math.cos(angle) * 1086 * 0.43 * radius, 10);
      expect(p.y).toBeCloseTo(Math.sin(angle) * 1000 * 0.38 * radius + 60, 10);
    });
  });
  it("keeps outer photos above inner photos and permits slight overlap", () => {
    const placed = projectTunnel(items, 0, 1086, 1000);
    expect(placed[0].scale).toBe(1);
    expect(placed[19].scale).toBe(0.15);
    expect(placed[0].zIndex).toBe(21);
    expect(placed[19].zIndex).toBe(2);
    expect(placed.every((p) => p.opacity === 1)).toBe(true);
  });
  it("keeps retained photographs continuous across recycling boundaries", () => {
    const before = projectTunnel(items, 299.999, 1086, 1000)[1];
    const after = projectTunnel(items.slice(1), 300.001, 1086, 1000)[0];
    expect(Math.abs(before.x - after.x)).toBeLessThan(0.01);
    expect(Math.abs(before.y - after.y)).toBeLessThan(0.01);
    expect(Math.abs(before.scale - after.scale)).toBeLessThan(0.001);
  });
  it("uses smoothstep for the one-second entry and half-second exit", () => {
    expect(fadeProgress(-1, 1)).toBe(0);
    expect(fadeProgress(0.5, heroEffects.tunnel.entryDuration)).toBe(0.5);
    expect(fadeProgress(1, heroEffects.tunnel.entryDuration)).toBe(1);
    expect(fadeProgress(0.25, heroEffects.tunnel.exitDuration)).toBe(0.5);
    expect(fadeProgress(0.5, heroEffects.tunnel.exitDuration)).toBe(1);
  });
  it("uses the same lowered center for photo and star trajectories", () => {
    const star = spiralPoint(12, 1086, 1000, false);
    const photo = projectTunnel(items, 0, 1086, 1000)[12];
    expect(star.x).toBe(photo.x);
    expect(star.y).toBe(photo.y);
    expect(heroEffects.tunnel.centerY).toBe(0.56);
  });
});
