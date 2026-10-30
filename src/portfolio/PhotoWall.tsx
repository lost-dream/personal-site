import { useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useReducedData } from "@/hooks/useReducedData";
import { Media } from "./Media";
import type { Photo } from "./content";
import { useFloatingWall } from "./useFloatingWall";
import { DocumentWall } from "./DocumentWall";

type PhotoWallProps = {
  photos: Photo[];
  title: string;
  mode?: "hero" | "document";
  onView: (photo: Photo) => void;
  suspended?: boolean;
};
export function PhotoWall(props: PhotoWallProps) {
  return props.mode === "hero" ? <LegacyPhotoWall {...props} /> : <DocumentWall {...props} />;
}

function LegacyPhotoWall({
  photos,
  title,
  mode = "document",
  onView,
  suspended = false,
}: PhotoWallProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [turn, setTurn] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const reduced = useReducedMotion();
  const saveData = useReducedData();
  const count = Math.min(mode === "hero" ? 6 : 1, photos.length);
  const canRotate = photos.length > count;
  const auto =
    canRotate &&
    !suspended &&
    !paused &&
    !focused &&
    !hovered &&
    visible &&
    !hidden &&
    !reduced &&
    !saveData;
  useFloatingWall(ref, mode === "hero" && !reduced && !saveData, count,
    !suspended && !paused && !focused && visible && !hidden && !reduced && !saveData);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(element);
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  useEffect(() => {
    if (!auto) return;
    // First rotation is after the opening; rotate one slot, never the entire wall.
    const interval = window.setInterval(
      () => setTurn((value) => value + 1),
      mode === "hero" ? 6000 : 8000,
    );
    return () => window.clearInterval(interval);
  }, [auto, mode]);
  const current = (slot: number) => {
    const index = slot + Math.floor((turn + count - 1 - slot) / count) * count;
    return photos[((index % photos.length) + photos.length) % photos.length];
  };
  return (
    <div
      ref={ref}
      className={`v2-wall v2-wall-${mode}`}
      data-drifting={mode === "document" ? !suspended && !paused && !focused && !hovered && visible && !hidden && !reduced && !saveData : undefined}
      role="region"
      aria-label={title}
      aria-roledescription="照片轮播"
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setFocused(false);
      }}
    >
      <div className="v2-wall-tiles">
        {count ? (
          Array.from({ length: count }, (_, slot) => {
            const photo = current(slot);
            return (
              <button
                className={`v2-wall-tile tile-${slot}`}
                type="button"
                key={slot}
                onClick={() => onView(photo)}
                aria-label={`放大查看${photo.title}`}
              >
                <div className="v2-wall-frame" key={photo.id}>
                  <Media
                    photo={photo}
                    contain={mode === "document"}
                    eager={mode === "hero"}
                  />
                </div>
              </button>
            );
          })
        ) : (
          <p className="v2-empty">{title}照片待补充。</p>
        )}
      </div>
      <div className="v2-wall-bottom">
        <span className="v2-wall-caption" aria-live={auto ? "off" : "polite"}>
          {mode === "document" && count ? current(0).title : title}
        </span>
        {canRotate && (
          <div className="v2-controls">
            <button
              type="button"
              onClick={() => setTurn((value) => value - 1)}
              aria-label={`${title}上一张`}
            >
              <CaretLeft aria-hidden="true" />
            </button>
            {!reduced && !saveData && (
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                aria-label={`${paused ? "继续" : "暂停"}${title}轮换`}
                aria-pressed={paused}
              >
                {paused ? (
                  <Play aria-hidden="true" />
                ) : (
                  <Pause aria-hidden="true" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setTurn((value) => value + 1)}
              aria-label={`${title}下一张`}
            >
              <CaretRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {mode === "document" && count > 0 && (
        <p className="v2-wall-note">
          {current(0).note || "名称、时间与颁发单位待补充。"}
        </p>
      )}
    </div>
  );
}
