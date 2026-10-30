import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PortfolioPage } from "./PortfolioPage";

describe("personalized hero", () => {
  it("uses the selected matte silver lettering without changing the opening masks", () => {
    render(<PortfolioPage />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("v2-frosted-title");
    expect(heading.querySelectorAll(".v2-title-mask [data-opening-title]")).toHaveLength(2);
    expect(heading).toHaveTextContent("认真生活尽兴探索");
  });
  it("renders a small window from the new 269-photo archive", () => {
    render(<PortfolioPage />);
    const wall = screen.getByRole("region", { name: "首页照片墙" });
    const images = wall.querySelectorAll(".v2-tunnel-photo img");
    expect(images).toHaveLength(20);
    for (const image of images) {
      expect(image).toHaveAttribute("src", expect.stringMatching(/\/media\/hero-tunnel\/thumb-\d+\.webp$/));
    }
    // News excerpts also mention the name; this assertion concerns the Hero identity.
    const hero = screen.getByRole("heading", { level: 1 }).closest("section")!;
    expect(within(hero).getByText("池树孝")).toBeVisible();
    expect(images[0]).toHaveAttribute("width", "1200");
    expect(images[0]).toHaveAttribute("height", "1600");
  });

  it.each([
    ["QQ", "2830394265"],
    ["微信", "cysy0318"],
    ["抖音账号 01", "67224716452"],
    ["抖音账号 02", "26471967472"],
  ])("copies the configured %s account", async (label, value) => {
    const user = userEvent.setup();
    render(<PortfolioPage />);
    await user.click(screen.getByRole("button", { name: `复制${label}账号` }));
    expect(await navigator.clipboard.readText()).toBe(value);
    expect(screen.getByRole("status")).toHaveTextContent(`${label}账号已复制`);
  });
});
