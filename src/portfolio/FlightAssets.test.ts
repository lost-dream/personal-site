import { expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

it("ships complete short-segment playlists and initialization media for all six profiles", () => {
  for (const number of [1, 2, 3]) for (const profile of ["desktop", "mobile"]) {
    const root = join("public/media/flight/hls/v1", `${number}-${profile}`);
    const playlist = readFileSync(join(root, "index.m3u8"), "utf8");
    expect(playlist).toContain("#EXT-X-ENDLIST");
    const init = playlist.match(/#EXT-X-MAP:URI="([^"]+)"/)?.[1];
    expect(init).toBe("init.mp4");
    expect(existsSync(join(root, init!))).toBe(true);
    const segments = playlist.split(/\r?\n/).filter(line => line.endsWith(".m4s"));
    expect(segments.length).toBeGreaterThan(5);
    for (const segment of segments) {
      expect(segment).toMatch(/^segment-\d{3}\.m4s$/);
      const bytes = statSync(join(root, segment)).size;
      expect(bytes).toBeGreaterThan(0);
      expect(bytes).toBeLessThan(1024 * 1024);
    }
    for (const duration of playlist.matchAll(/#EXTINF:([\d.]+)/g)) {
      expect(Number(duration[1])).toBeLessThanOrEqual(2.1);
    }
  }
});
