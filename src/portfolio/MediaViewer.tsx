import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import { Media } from "./Media";
import type { Photo } from "./content";

export function MediaViewer({
  photo,
  onClose,
}: {
  photo: Photo;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  const [curtainFailed, setCurtainFailed] = useState(false);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className="v2-viewer"
      aria-labelledby="viewer-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {photo.kind !== "video" && photo.src && !curtainFailed && (
        <div className="v2-viewer-curtain" aria-hidden="true">
          <img src={photo.src} alt="" decoding="async" onError={() => setCurtainFailed(true)} />
        </div>
      )}
      <div className="v2-viewer-panel">
        <header>
          <h2 id="viewer-title">{photo.title}</h2>
          <button type="button" onClick={onClose} aria-label="关闭查看">
            <X aria-hidden="true" />
          </button>
        </header>
        {photo.kind === "video" && photo.src && !failed ? (
          <video
            src={photo.src}
            controls
            playsInline
            preload="metadata"
            poster={photo.poster}
            onError={() => setFailed(true)}
            aria-label={photo.title}
          >
            {photo.captions && (
              <track
                kind="captions"
                src={photo.captions}
                srcLang="zh"
                label="中文字幕"
                default
              />
            )}
          </video>
        ) : (
          <Media photo={photo} contain eager />
        )}
        <p>
          {failed
            ? "视频暂不可用，请稍后重试。"
            : photo.note ||
              (!photo.src ? "素材待补充，当前为蓝色占位预览。" : "")}
        </p>
      </div>
    </dialog>,
    document.body,
  );
}
