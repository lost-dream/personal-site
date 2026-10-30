import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MediaViewer } from "./MediaViewer";

// jsdom does not implement native modal layout/focus isolation; browser checks
// cover those. These shims let us exercise our failure and cleanup behavior.
beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.setAttribute("open", "");
      },
    },
    close: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.removeAttribute("open");
      },
    },
  });
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

it("uses the opened image as a decorative curtain without duplicating its accessible name", () => {
  render(<MediaViewer photo={{ id: "new-photo", title: "新照片", src: "/new-photo.webp" }} onClose={() => {}} />);
  const curtain = document.querySelector(".v2-viewer-curtain img");
  expect(curtain).toHaveAttribute("src", "/new-photo.webp");
  expect(curtain).toHaveAttribute("alt", "");
  expect(screen.getAllByRole("img")).toHaveLength(1);
  fireEvent.error(curtain!);
  expect(document.querySelector(".v2-viewer-curtain img")).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: "新照片" })).toBeInTheDocument();
});

it("keeps videos and empty placeholders out of the image curtain", () => {
  const { rerender } = render(<MediaViewer photo={{ id: "empty", title: "待添加" }} onClose={() => {}} />);
  expect(document.querySelector(".v2-viewer-curtain")).not.toBeInTheDocument();
  rerender(<MediaViewer photo={{ id: "video", title: "视频", kind: "video", src: "/video.mp4" }} onClose={() => {}} />);
  expect(document.querySelector(".v2-viewer-curtain")).not.toBeInTheDocument();
});

it("closes on the outer curtain and Escape but not on the foreground image", () => {
  const onClose = vi.fn();
  render(<MediaViewer photo={{ id: "photo", title: "照片", src: "/photo.webp" }} onClose={onClose} />);
  fireEvent.click(screen.getByRole("img", { name: "照片" }));
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("dialog"));
  expect(onClose).toHaveBeenCalledTimes(1);
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
  expect(onClose).toHaveBeenCalledTimes(2);
});

it("replaces a failed local video with a readable fallback", () => {
  render(
    <MediaViewer
      photo={{
        id: "flight",
        title: "飞行视频",
        kind: "video",
        src: "/flight.mp4",
      }}
      onClose={() => {}}
    />,
  );
  const video = screen.getByLabelText("飞行视频", { selector: "video" });
  expect(video).toHaveAttribute("src", "/flight.mp4");
  fireEvent.error(video);
  expect(
    screen.queryByLabelText("飞行视频", { selector: "video" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText("视频暂不可用，请稍后重试。")).toBeVisible();
});

it("restores prior focus and body scrolling when the viewer unmounts", () => {
  const button = document.createElement("button");
  document.body.append(button);
  button.focus();
  const previousOverflow = document.body.style.overflow;
  const { unmount } = render(
    <MediaViewer photo={{ id: "award", title: "奖状" }} onClose={() => {}} />,
  );
  expect(document.body.style.overflow).toBe("hidden");
  unmount();
  expect(document.activeElement).toBe(button);
  expect(document.body.style.overflow).toBe(previousOverflow);
  button.remove();
});
