import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { PublicationCard } from "./PublicationCard";
import { WorksPreview } from "./WorksPreview";
import { portfolioContent } from "./content";

const publication = portfolioContent.publications![0];
vi.mock("./motion", () => ({ useV2Motion: () => undefined }));
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } },
    close: { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); } },
  });
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); document.body.style.overflow = "";
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

it("keeps the original coverage heading and three articles, with an authored journal card before them", () => {
  const { container } = render(<WorksPreview />);
  const section = container.querySelector("#news-coverage")!;
  expect(within(section as HTMLElement).getByRole("heading", { name: "新闻里的足迹", level: 3 })).toBeVisible();
  const card = section.querySelector(".v2-publication-card")!;
  expect(section.querySelectorAll(".v2-news-entry")).toHaveLength(3);
  expect(card.compareDocumentPosition(section.querySelector(".v2-news")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(card).toHaveTextContent(publication.title);
  expect(card).toHaveTextContent("作者：池树孝");
  expect(card).toHaveTextContent("2026 年 · 第 3 卷第 9 期 · 113–115 页");
  expect(card).toHaveTextContent("期刊论文 · 技术综述");
  expect(card).toHaveTextContent(publication.doi);
  expect(within(card as HTMLElement).getByRole("img")).toHaveAttribute("src", "/media/publications/railway-support/cover.webp");
  const source = within(card as HTMLElement).getByRole("link", { name: "期刊官网原文（新窗口）" });
  expect(source).toHaveAttribute("href", "https://yuanhong.pub/shfzykjcx/shfz260937.html");
  expect(source).toHaveAttribute("rel", "noopener noreferrer");
  expect(source).toHaveAttribute("target", "_blank");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("reads all three pages in a modal, keeps zoom, and restores focus and scroll lock on close", async () => {
  const user = userEvent.setup();
  document.body.style.overflow = "clip";
  render(<PublicationCard publication={publication} />);
  const trigger = screen.getByRole("button", { name: /站内阅读全文/ });
  await user.click(trigger);
  const dialog = screen.getByRole("dialog", { name: publication.title });
  const reader = within(dialog);
  expect(document.body.style.overflow).toBe("hidden");
  expect(reader.getByRole("button", { name: "关闭论文阅读" })).toHaveFocus();
  expect(reader.getByRole("button", { name: "论文上一页" })).toBeDisabled();
  expect(reader.getByRole("img", { name: "论文正文第1页，刊物第113页" })).toHaveAttribute("src", "/media/publications/railway-support/page-1.webp");
  await user.click(reader.getByRole("button", { name: "论文下一页" }));
  expect(reader.getByText("第 2 / 3 页 · 刊物第 114 页")).toBeVisible();
  expect(reader.getByRole("img", { name: "论文正文第2页，刊物第114页" })).toHaveAttribute("src", "/media/publications/railway-support/page-2.webp");
  await user.selectOptions(reader.getByRole("combobox", { name: "论文页面缩放" }), "2");
  expect(dialog.querySelector(".v2-publication-paper")).toHaveStyle({ width: "200%", maxWidth: "1800px" });
  await user.click(reader.getByRole("button", { name: "论文下一页" }));
  expect(reader.getByRole("img", { name: "论文正文第3页，刊物第115页" })).toHaveAttribute("src", "/media/publications/railway-support/page-3.webp");
  expect(reader.getByRole("button", { name: "论文下一页" })).toBeDisabled();
  expect(reader.getByRole("combobox", { name: "论文页面缩放" })).toHaveValue("2");
  await user.click(reader.getByRole("button", { name: "跳至论文第1页" }));
  expect(reader.getByRole("button", { name: "跳至论文第1页" })).toHaveAttribute("aria-current", "page");
  await user.click(reader.getByRole("button", { name: "关闭论文阅读" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(document.body.style.overflow).toBe("clip");
});

it("supports arrow-key pagination, stays within page bounds, and closes with native Escape cancellation", async () => {
  const user = userEvent.setup();
  render(<PublicationCard publication={publication} />);
  await user.click(screen.getByRole("button", { name: /站内阅读全文/ }));
  const dialog = screen.getByRole("dialog");
  fireEvent.keyDown(dialog, { key: "ArrowLeft" });
  expect(within(dialog).getByText("第 1 / 3 页 · 刊物第 113 页")).toBeVisible();
  fireEvent.keyDown(dialog, { key: "ArrowRight" });
  expect(within(dialog).getByText("第 2 / 3 页 · 刊物第 114 页")).toBeVisible();
  fireEvent.keyDown(within(dialog).getByRole("combobox"), { key: "ArrowRight" });
  expect(within(dialog).getByText("第 2 / 3 页 · 刊物第 114 页")).toBeVisible();
  fireEvent.keyDown(dialog, { key: "ArrowRight" });
  fireEvent.keyDown(dialog, { key: "ArrowRight" });
  expect(within(dialog).getByText("第 3 / 3 页 · 刊物第 115 页")).toBeVisible();
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("keeps reading available if the cover or page fails, with original PDF fallback", async () => {
  const user = userEvent.setup();
  render(<PublicationCard publication={publication} />);
  fireEvent.error(screen.getByRole("img"));
  await user.click(screen.getByRole("button", { name: `查看论文《${publication.title}》` }));
  const dialog = screen.getByRole("dialog");
  fireEvent.error(within(dialog).getByRole("img", { name: "论文正文第1页，刊物第113页" }));
  expect(within(dialog).getByRole("alert")).toHaveTextContent("本页暂时无法加载");
  const pdf = within(dialog).getByRole("link", { name: "下载原始PDF" });
  expect(pdf).toHaveAttribute("href", "/media/publications/railway-support/article.pdf");
  expect(pdf).toHaveAttribute("download", `${publication.title}.pdf`);
  await user.click(within(dialog).getByRole("button", { name: "论文下一页" }));
  expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
  expect(within(dialog).getByRole("img", { name: "论文正文第2页，刊物第114页" })).toBeVisible();
  fireEvent.click(dialog);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("ships all original pages and a valid original PDF rather than missing paths", () => {
  expect(publication.pages).toHaveLength(3);
  for (const page of publication.pages) {
    expect(existsSync(`public${page.src}`)).toBe(true);
    const bytes = readFileSync(`public${page.src}`);
    expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
    expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
    expect(page.width).toBe(1697);
    expect(page.height).toBe(2400);
  }
  expect(readFileSync(`public${publication.pdf}`).subarray(0, 5).toString()).toBe("%PDF-");
});
