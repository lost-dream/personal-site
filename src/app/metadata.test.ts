/// <reference types="node" />

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("preview publishing defaults", () => {
  it("uses the approved identity while blocking indexing until the release build", () => {
    const html = readFileSync(join(process.cwd(), "index.html"), "utf8");

    expect(html).toContain(
      '<meta name="description" content="池树孝的个人网站，记录荣誉与证书、影像与代码作品，以及把热爱付诸实践的经历。" />',
    );
    expect(html).toContain('<meta name="robots" content="noindex,nofollow" />');
    expect(html).toContain(
      '<meta property="og:title" content="池树孝 · 认真生活，尽兴探索" />',
    );
    expect(html).toContain(
      '<meta property="og:description" content="个人经历、影像与代码作品，以及把热爱付诸实践的记录。" />',
    );
    expect(html).toContain('<meta name="theme-color" content="#0B0D10" />');
    expect(html).toContain("<title>池树孝 · 认真生活，尽兴探索</title>");
    expect(html).not.toContain('rel="canonical"');
  });

  it("blocks crawlers without publishing a sitemap", () => {
    const robotsPath = join(process.cwd(), "public/robots.txt");

    expect(existsSync(robotsPath)).toBe(true);
    if (!existsSync(robotsPath)) return;

    const robots = readFileSync(robotsPath, "utf8").replace(/\r\n/g, "\n");
    expect(robots).toBe("User-agent: *\nDisallow: /\n");
    expect(robots).not.toContain("Sitemap:");
  });

  it("keeps the lab-mark favicon in the document", () => {
    const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
    const favicon = readFileSync(
      join(process.cwd(), "public/favicon.svg"),
      "utf8",
    );

    expect(html).toContain(
      '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
    );
    expect(favicon).toContain('rx="2"');
    expect(favicon).toContain("#2864E8");
    expect(favicon).not.toMatch(/#(?:863bff|7e14ff|47bfff|ede6ff)/i);

    // Visual palette and contrast are reviewed in the rendered page. Enumerating
    // every literal shade makes this metadata test fail on intentional redesigns.
  });

  it("preloads the two critical production font resources", () => {
    const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
    const preloads =
      html.match(/<link[^>]+rel="preload"[^>]+as="font"[^>]*>/g) ?? [];

    expect(preloads).toHaveLength(2);
    expect(preloads.join("\n")).toContain("archivo-latin-wght-normal.woff2");
    expect(preloads.join("\n")).toContain("noto-sans-sc-118-wght-normal.woff2");
    preloads.forEach((link) => {
      expect(link).toContain('type="font/woff2"');
      expect(link).toContain("crossorigin");
    });
  });
});
