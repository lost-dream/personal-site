import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { portfolioContent } from "./content";
import { PortfolioPage } from "./PortfolioPage";

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) { this.callback = callback; }
    observe(target: Element) { this.callback([{ target, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    unobserve() {}
    disconnect() {}
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("experience materials", () => {
  it("includes every PDF page with an existing image and original aspect ratio", () => {
    expect(portfolioContent.awards).toHaveLength(16);
    expect(portfolioContent.certificates).toHaveLength(6);
    for (const photo of [...portfolioContent.awards, ...portfolioContent.certificates]) {
      expect(existsSync(resolve("public", photo.src!.replace(/^\//, "")))).toBe(true);
      expect(photo.width).toBeGreaterThan(0);
      expect(photo.height).toBeGreaterThan(0);
    }
    const portrait = portfolioContent.certificates[5];
    expect(portrait.height!).toBeGreaterThan(portrait.width!);
  });

  it("shows the background and separate navigable document walls", async () => {
    const user = userEvent.setup();
    const { container } = render(<PortfolioPage />);
    expect(container.querySelector("#experience .v2-hero-backdrop img"))
      .toHaveAttribute("src", "/media/experience-background.webp");
    const honors = screen.getByRole("region", { name: "荣誉" });
    expect(within(honors).getByRole("img")).toHaveAttribute("src", "/media/experience/awards/page-01.webp");
    await user.click(within(honors).getByRole("button", { name: "荣誉下一张" }));
    fireEvent.load(honors.querySelector('img[src="/media/experience/awards/page-02.webp"]')!);
    expect(within(honors).getByRole("img")).toHaveAttribute("src", "/media/experience/awards/page-02.webp");
    const certificates = screen.getByRole("region", { name: "证书" });
    expect(within(certificates).getByRole("img")).toHaveAttribute("src", "/media/experience/certificates/page-01.webp");
    expect(honors.querySelector(".v2-wall-bottom, .v2-wall-note")).toBeNull();
    expect(certificates.querySelector(".v2-wall-bottom, .v2-wall-note")).toBeNull();
    expect(within(honors).queryByRole("button", { name: "暂停荣誉轮换" })).not.toBeInTheDocument();
    expect(within(certificates).getByRole("button", { name: "证书上一张" })).toHaveClass("arrow-left");
    expect(within(certificates).getByRole("button", { name: "证书下一张" })).toHaveClass("arrow-right");
  });
});
