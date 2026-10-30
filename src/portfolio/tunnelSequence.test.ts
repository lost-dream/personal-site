import { expect, it } from "vitest";
import photos from "./tunnel-photos.json";
import order from "./hero-tunnel-order.json";
import { portfolioContent } from "./content";

it("imports all 269 approved photos once, including the reference's starting order", () => {
  expect(order).toHaveLength(269);
  expect(new Set(order).size).toBe(269);
  expect([...order].sort((a, b) => a - b)).toEqual(photos.map((_, index) => index));
  expect(order.slice(0, 5).map((index) => photos[index].source)).toEqual([
    "gc-16.png", "x-224-45.png", "scene-art-7.png", "x-100-25.png", "scene-26.png",
  ]);
  expect(portfolioContent.hero[0].src).toContain(photos[15].file);
});
it("keeps three other-prefix photos between matching prefixes, across the loop seam", () => {
  const prefixes = order.map((index) => photos[index].source.replace(/-\d+\.[^.]+$/, ""));
  prefixes.forEach((prefix, index) => {
    for (let gap = 1; gap <= 3; gap++) expect(prefixes[(index + gap) % prefixes.length]).not.toBe(prefix);
  });
});
