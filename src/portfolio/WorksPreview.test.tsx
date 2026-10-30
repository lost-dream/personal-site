import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WorksPreview } from "./WorksPreview";
import { PortfolioPage } from "./PortfolioPage";

vi.mock("./motion", () => ({ useV2Motion: () => undefined }));
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } },
    close: { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); } },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

it("shows only module three with the same four content groups", () => {
  const { container } = render(<WorksPreview />);
  expect(container.querySelectorAll("main > section")).toHaveLength(1);
  expect(screen.getByRole("region", { name: "个人作品集" })).toHaveAttribute("id", "projects");
  for (const title of ["影像作品", "小程序", "开源项目", "新闻里的足迹"])
    expect(screen.getByRole("heading", { name: title, level: 3 })).toBeInTheDocument();
  expect(container.querySelector("#home, #experience, #practice, #life")).toBeNull();
  expect(screen.getByRole("link", { name: "返回完整网站 ↗" })).toHaveAttribute("href", "/#projects");
});
it("integrates the approved module in the full site with its background confined to that section", async () => {
  const user = userEvent.setup();
  const { container } = render(<PortfolioPage />);
  const works = screen.getByRole("region", { name: "个人作品集" });
  expect(container.querySelectorAll("main > section")).toHaveLength(4);
  expect(works.querySelector(".v2-works-photo-background")).toHaveAttribute("aria-hidden", "true");
  expect(container.querySelectorAll(".v2-works-photo-background")).toHaveLength(1);
  expect(container.querySelector(".v2-paper-stream")).toBeNull();
  expect(works.querySelectorAll("video")).toHaveLength(3);
  expect(works.querySelectorAll(".v2-program")).toHaveLength(2);
  expect(works.querySelectorAll(".v2-repo")).toHaveLength(2);
  expect(works.querySelectorAll(".v2-news-entry")).toHaveLength(3);
  expect(screen.queryByText("第三模块 · 独立预览")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /作品集背景/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "放大职业技能刷题二维码" }));
  expect(screen.getByRole("dialog", { name: "职业技能刷题·小程序码" })).toBeInTheDocument();
});
it("keeps the module's QR enlargement interaction", async () => {
  const user = userEvent.setup();
  render(<WorksPreview />);
  await user.click(screen.getByRole("button", { name: "放大职业技能刷题二维码" }));
  expect(screen.getByRole("dialog", { name: "职业技能刷题·小程序码" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "关闭查看" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("shows exactly the two supplied GitHub repositories with verified descriptions and safe links", () => {
  const { container } = render(<WorksPreview />);
  const repos = container.querySelector("#open-source-projects")!;
  expect(repos.querySelectorAll(".v2-repo")).toHaveLength(2);
  expect([...repos.querySelectorAll("h4")].map((heading) => heading.textContent)).toEqual([
    "苍梦 · cangmeng", "小说创作工作台 · story-workbenches",
  ]);
  const links = [...repos.querySelectorAll("a.v2-repo-link")];
  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "https://github.com/lost-dream/cangmeng", "https://github.com/lost-dream/story-workbenches",
  ]);
  for (const link of links) {
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  expect(repos.textContent).not.toMatch(/GitHub 项目 0|项目用途待补充|个人贡献待补充|仓库链接待补充/);
  expect(repos.querySelector("img")).toHaveAttribute("src", "/media/github/cangmeng.png");
  expect(repos.querySelector(".v2-media")).toHaveClass("is-contained");
  expect(container.querySelector("#repo-3")).toBeNull();
});
it("shows the first real mini-program without cropping its screenshot and keeps screenshot enlargement", async () => {
  const user = userEvent.setup();
  const { container } = render(<WorksPreview />);
  expect(screen.getByRole("heading", { name: "职业技能刷题", level: 4 })).toBeInTheDocument();
  expect(screen.getByText("面向铁路线路工的普速题库，提供章节练习、模拟考试与错题复习。")).toBeInTheDocument();
  const screenshot = screen.getByRole("button", { name: "放大职业技能刷题界面截图" });
  expect(screenshot.querySelector(".v2-media")).toHaveClass("is-contained");
  expect(screenshot.querySelector("img")).toHaveAttribute("src", "/media/programs/railway-practice/home.png");
  expect(screen.getByRole("img", { name: "职业技能刷题的微信小程序码" })).toHaveAttribute("src", "/media/programs/railway-practice/qr.jpg");
  expect(container.querySelectorAll(".v2-program")).toHaveLength(2);
  await user.click(screenshot);
  expect(screen.getByRole("dialog", { name: "职业技能刷题·首页" })).toBeInTheDocument();
});
it("adds the calculator as a separate second program with its own screenshot and QR viewer", async () => {
  const user = userEvent.setup();
  const { container } = render(<WorksPreview />);
  expect([...container.querySelectorAll(".v2-program")].map((program) => program.id)).toEqual(["program-1", "program-2"]);
  expect(screen.getByRole("heading", { name: "左到右计算", level: 4 })).toBeInTheDocument();
  const screenshot = screen.getByRole("button", { name: "放大左到右计算界面截图" });
  expect(screenshot.querySelector(".v2-media")).toHaveClass("is-contained");
  expect(screenshot.querySelector("img")).toHaveAttribute("src", "/media/programs/calculator/screen.png");
  expect(screen.getByRole("img", { name: "左到右计算的微信小程序码" })).toHaveAttribute("src", "/media/programs/calculator/qr.jpg");
  await user.click(screen.getByRole("button", { name: "放大左到右计算二维码" }));
  expect(screen.getByRole("dialog", { name: "左到右计算·小程序码" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "关闭查看" }));
  await user.click(screenshot);
  expect(screen.getByRole("dialog", { name: "左到右计算·界面" })).toBeInTheDocument();
});
it("shows the three verified news articles with original destinations, dates and safe external links", () => {
  const { container } = render(<WorksPreview />);
  const news = container.querySelector("#news-coverage")!;
  const links = [...news.querySelectorAll("a.v2-news-link")];
  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "https://www.sxworker.com/e/wap/show.php?id=198401",
    "https://m.tech.china.com/redian/2025/0320/032025_1650395.html",
    "https://m.tech.china.com/redian/2025/0527/052025_1678309.html",
  ]);
  expect([...news.querySelectorAll(".v2-news h4")].map((heading) => heading.textContent)).toEqual([
    "校企协同探新路 数智赋能育英才 ——西安铁路职业技术学院以产教融合推动技术创新",
    "西安铁路职业技术学院师生研发桥梁减隔震产品在工程上试用",
    "西安铁路职业技术学院学子深入蔬菜种植基地调研，赋能乡村振兴",
  ]);
  expect([...news.querySelectorAll("time")].map((time) => time.dateTime)).toEqual(["2025-04-23", "2025-03-20", "2025-05-27"]);
  for (const link of links) {
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link.textContent).toContain("阅读原文");
  }
  expect(news.textContent).toContain("陕工网—陕西工人报");
  expect(news.textContent).toContain("中华网");
  expect(news.textContent).not.toContain("报道链接待补充");
});
it("shows the available original news photo, highlights the name in source excerpts, and enlarges the photo", async () => {
  const user = userEvent.setup();
  const { container } = render(<WorksPreview />);
  const news = container.querySelector("#news-coverage")!;
  expect(news.querySelectorAll("blockquote")).toHaveLength(3);
  expect([...news.querySelectorAll("blockquote mark")].map((mark) => mark.textContent)).toEqual(["池树孝", "池树孝", "池树孝"]);
  expect(news.querySelectorAll(".v2-news-image-note")).toHaveLength(2);
  const photo = screen.getByRole("button", { name: "放大陕工网桥梁项目报道配图" });
  expect(photo.querySelector("img")).toHaveAttribute("src", "/media/news/sxworker-bridge.jpg");
  expect(photo.closest("a")).toBeNull();
  await user.click(photo);
  expect(screen.getByRole("dialog", { name: "陕工网桥梁项目报道配图" })).toBeInTheDocument();
});
