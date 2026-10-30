import { createFloatWorld, stepFloatWorld, type FloatBody } from "./floatPhysics";

const body = (x: number, vx: number): FloatBody => ({
  x, y: 50, width: 60, height: 80, vx, vy: 0, phase: 0,
});

function expectSeparated(bodies: FloatBody[], width: number, height: number) {
  for (const a of bodies) {
    expect(a.x).toBeGreaterThanOrEqual(0);
    expect(a.y).toBeGreaterThanOrEqual(0);
    expect(a.x + a.width).toBeLessThanOrEqual(width + 0.01);
    expect(a.y + a.height).toBeLessThanOrEqual(height + 0.01);
    for (const b of bodies) {
      if (a === b) continue;
      expect(a.x + a.width <= b.x + 0.01 || b.x + b.width <= a.x + 0.01 ||
        a.y + a.height <= b.y + 0.01 || b.y + b.height <= a.y + 0.01).toBe(true);
    }
  }
}

describe("floating photo collision simulation", () => {
  it("reverses approaching photos and separates their rectangles", () => {
    const bodies = [body(60, 12), body(115, -12)];
    stepFloatWorld(bodies, 300, 220, 1 / 60, 0);
    expect(bodies[0].vx).toBeLessThan(0);
    expect(bodies[1].vx).toBeGreaterThan(0);
    expectSeparated(bodies, 300, 220);
  });
  it("reflects velocity at a wall without leaving the region", () => {
    const bodies = [body(241, 12)];
    stepFloatWorld(bodies, 300, 220, 1 / 60, 0);
    expect(bodies[0].vx).toBeLessThan(0);
    expectSeparated(bodies, 300, 220);
  });
  it("keeps the hovered photo stationary when another photo hits it", () => {
    const bodies = [body(60, 12), body(115, -12)];
    stepFloatWorld(bodies, 300, 220, 1 / 60, 0, 0);
    expect(bodies[0].x).toBe(60);
    expect(bodies[0].y).toBe(50);
    expect(bodies[1].vx).toBeGreaterThan(0);
    expectSeparated(bodies, 300, 220);
  });
  it.each([[660, 630], [320, 390], [920, 440]])(
    "keeps six moving photos non-overlapping for 90 seconds at %s × %s",
    (width, height) => {
      const bodies = createFloatWorld(width, height, 6, () => 0.43);
      const start = bodies.map(b => [b.x, b.y]);
      for (let frame = 0; frame < 5400; frame++) {
        stepFloatWorld(bodies, width, height, 1 / 60, frame / 60);
        if (frame % 30 === 0) expectSeparated(bodies, width, height);
      }
      expect(bodies.some((b, i) => Math.hypot(b.x - start[i][0], b.y - start[i][1]) > 10)).toBe(true);
    },
  );
  it("handles an empty wall and clamps a long background-tab interval", () => {
    expect(createFloatWorld(0, 0, 0)).toEqual([]);
    const bodies = createFloatWorld(600, 500, 6, () => 0.3);
    stepFloatWorld(bodies, 600, 500, 120, 10);
    expectSeparated(bodies, 600, 500);
  });
});
