import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PhotoWall } from "./PhotoWall";
import { Media } from "./Media";
import { SocialLinks } from "./SocialLinks";
import { Works, WorkLink } from "./Works";
import { portfolioContent } from "./content";
import { documentWallMotion } from "./document-wall.config";

const photos = [
  { id: "a", title: "第一张奖状" },
  { id: "b", title: "第二张奖状" },
  { id: "c", title: "第三张奖状" },
];
let observerCallbacks: IntersectionObserverCallback[];
beforeEach(() => {
  observerCallbacks = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        observerCallbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const visibility = (isIntersecting: boolean) =>
  act(() =>
    observerCallbacks.forEach((callback) => callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )),
  );

describe("photo wall controls", () => {
  it("pauses document motion and rotation while the pointer is over the wall", () => {
    vi.useFakeTimers();
    render(<PhotoWall photos={photos} title="奖状" onView={() => {}} />);
    visibility(true);
    const wall = screen.getByRole("region", { name: "奖状" });
    expect(wall).toHaveAttribute("data-drifting", "true");
    fireEvent.pointerEnter(wall, { pointerType: "mouse" });
    expect(wall).toHaveAttribute("data-drifting", "false");
    act(() => vi.advanceTimersByTime(9000));
    expect(screen.getByRole("button", { name: "放大查看第一张奖状" })).toBeVisible();
    fireEvent.pointerLeave(wall);
    expect(wall).toHaveAttribute("data-drifting", "true");
    visibility(false);
    expect(wall).toHaveAttribute("data-drifting", "false");
  });
  it("moves backwards across the first photo and forwards across the last", () => {
    vi.useFakeTimers();
    render(<PhotoWall photos={photos} title="奖状" onView={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "奖状上一张" }));
    expect(
      screen.getByRole("button", { name: "放大查看第三张奖状" }),
    ).toBeVisible();
    act(() => vi.advanceTimersByTime(1100));
    fireEvent.click(screen.getByRole("button", { name: "奖状下一张" }));
    expect(
      screen.getByRole("button", { name: "放大查看第一张奖状" }),
    ).toBeVisible();
  });
  it("rotates only on-screen with no bottom controls or explicit pause UI", () => {
    vi.useFakeTimers();
    render(<PhotoWall photos={photos} title="奖状" onView={() => {}} />);
    act(() => vi.advanceTimersByTime(9000));
    expect(
      screen.getByRole("button", { name: "放大查看第一张奖状" }),
    ).toBeVisible();
    visibility(true);
    act(() => vi.advanceTimersByTime(documentWallMotion.interval));
    expect(
      screen.getByRole("button", { name: "放大查看第二张奖状" }),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "暂停奖状轮换" })).not.toBeInTheDocument();
    expect(document.querySelector(".v2-wall-bottom, .v2-wall-note")).toBeNull();
    act(() => vi.advanceTimersByTime(documentWallMotion.duration));
    act(() => vi.advanceTimersByTime(documentWallMotion.interval));
    expect(
      screen.getByRole("button", { name: "放大查看第三张奖状" }),
    ).toBeVisible();
    visibility(false);
    act(() => vi.advanceTimersByTime(16000));
    expect(
      screen.getByRole("button", { name: "放大查看第三张奖状" }),
    ).toBeVisible();
  });
  it("freezes while a user is focused on a photo", () => {
    vi.useFakeTimers();
    render(<PhotoWall photos={photos} title="奖状" onView={() => {}} />);
    visibility(true);
    fireEvent.focus(screen.getByRole("button", { name: "放大查看第一张奖状" }));
    act(() => vi.advanceTimersByTime(16000));
    expect(
      screen.getByRole("button", { name: "放大查看第一张奖状" }),
    ).toBeVisible();
  });
  it("freezes behind the media viewer and when the document becomes hidden", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <PhotoWall photos={photos} title="奖状" onView={() => {}} suspended />,
    );
    visibility(true);
    act(() => vi.advanceTimersByTime(16000));
    expect(
      screen.getByRole("button", { name: "放大查看第一张奖状" }),
    ).toBeVisible();
    rerender(<PhotoWall photos={photos} title="奖状" onView={() => {}} />);
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(16000));
    expect(
      screen.getByRole("button", { name: "放大查看第一张奖状" }),
    ).toBeVisible();
    hidden.mockRestore();
  });
  it("keeps manual browsing but never autoplays for reduced motion", () => {
    vi.useFakeTimers();
    const original = window.matchMedia;
    const media = vi
      .spyOn(window, "matchMedia")
      .mockImplementation((query) => ({
        ...original(query),
        matches: query.includes("reduced-motion"),
      }));
    render(<PhotoWall photos={photos} title="奖状" onView={() => {}} />);
    visibility(true);
    act(() => vi.advanceTimersByTime(16000));
    expect(
      screen.getByRole("button", { name: "放大查看第一张奖状" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "暂停奖状轮换" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "奖状下一张" }));
    expect(
      screen.getByRole("button", { name: "放大查看第二张奖状" }),
    ).toBeVisible();
    media.mockRestore();
  });
  it("does not expose rotation controls for one photo or crash with none", () => {
    const { rerender } = render(
      <PhotoWall photos={photos.slice(0, 1)} title="奖状" onView={() => {}} />,
    );
    expect(
      screen.queryByRole("button", { name: "奖状下一张" }),
    ).not.toBeInTheDocument();
    rerender(<PhotoWall photos={[]} title="奖状" onView={() => {}} />);
    expect(screen.getByText("奖状照片待补充。")).toBeVisible();
  });
  it("changes only one of the six hero tiles per rotation", () => {
    vi.useFakeTimers();
    render(
      <PhotoWall
        photos={portfolioContent.hero}
        title="首页"
        mode="hero"
        onView={() => {}}
      />,
    );
    visibility(true);
    act(() => vi.advanceTimersByTime(6000));
    expect(
      screen.queryByRole("button", { name: `放大查看${portfolioContent.hero[0].title}` }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `放大查看${portfolioContent.hero[6].title}` }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: `放大查看${portfolioContent.hero[1].title}` }),
    ).toBeVisible();
  });
});

it("falls back when an image fails and retries a replacement asset", () => {
  const { rerender } = render(
    <Media photo={{ id: "a", title: "奖状", src: "/missing.jpg" }} />,
  );
  fireEvent.error(screen.getByRole("img", { name: "奖状" }));
  expect(screen.getByRole("img", { name: "奖状，蓝色图片占位" })).toBeVisible();
  rerender(<Media photo={{ id: "a", title: "奖状", src: "/new.jpg" }} />);
  expect(screen.getByRole("img", { name: "奖状" })).toHaveAttribute(
    "src",
    "/new.jpg",
  );
});

it("renders each video destination as its own external link without inline video", () => {
  const content = {
    ...portfolioContent,
    videos: [
      {
        id: "v1",
        title: "第一部影片",
        note: "航拍",
        href: "https://www.douyin.com/video/1",
      },
      {
        id: "v2",
        title: "第二部影片",
        note: "校园",
        href: "https://www.douyin.com/video/2",
      },
    ],
  };
  const { container } = render(<Works content={content} onView={() => {}} />);
  expect(
    screen.getByRole("link", { name: "第一部影片（新窗口）" }),
  ).toHaveAttribute("href", "https://www.douyin.com/video/1");
  expect(
    screen.getByRole("link", { name: "第二部影片（新窗口）" }),
  ).toHaveAttribute("href", "https://www.douyin.com/video/2");
  expect(container.querySelector("video")).toBeNull();
});

it("does not make missing or unsafe destinations clickable", () => {
  render(
    <>
      <WorkLink work={{ id: "1", title: "未配置", note: "" }}>未配置</WorkLink>
      <WorkLink
        work={{ id: "2", title: "无效", note: "", href: "javascript:alert(1)" }}
      >
        无效
      </WorkLink>
    </>,
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

it("keeps both Douyin slots independent and reports clipboard failures", async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
    new Error("denied"),
  );
  render(
    <SocialLinks
      socials={[
        { label: "QQ", value: "test-account" },
        { label: "微信" },
        { label: "抖音账号 01", href: "https://www.douyin.com/user/one" },
        { label: "抖音账号 02", href: "https://www.douyin.com/user/two" },
      ]}
      onView={() => {}}
    />,
  );
  expect(
    screen.getByRole("link", { name: "打开抖音账号 01主页（新窗口）" }),
  ).toHaveAttribute("href", "https://www.douyin.com/user/one");
  expect(
    screen.getByRole("link", { name: "打开抖音账号 02主页（新窗口）" }),
  ).toHaveAttribute("href", "https://www.douyin.com/user/two");
  expect(
    screen.queryByRole("button", { name: "复制微信账号" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "复制QQ账号" }));
  expect(
    within(screen.getByRole("status")).getByText(/手动复制/),
  ).toBeVisible();
});
