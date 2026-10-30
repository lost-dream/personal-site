import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useRef } from "react";
import { Media } from "./Media";
import type { Photo } from "./content";

export function Practice({
  photos,
  onView,
}: {
  photos: Photo[];
  onView: (photo: Photo) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  function move(direction: number) {
    const element = viewport.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth * 0.75,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  return (
    <section
      id="practice"
      className="v2-practice"
      aria-labelledby="practice-title"
    >
      <div className="v2-practice-stage">
        <div className="v2-container">
          <h2 id="practice-title" className="v2-heading" data-v2-title>
            把热爱付诸实践
          </h2>
          <p className="v2-intro">
            比赛、活动与实践。每一张照片，都是参与的证明。
          </p>
        </div>
        <div
          className="v2-practice-viewport"
          ref={viewport}
          tabIndex={0}
          role="region"
          aria-label="比赛与活动照片，使用左右方向键浏览"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              move(event.key === "ArrowRight" ? 1 : -1);
            }
          }}
        >
          <div className="v2-practice-track">
            {photos.map((photo, index) => (
              <figure
                className={`v2-practice-photo photo-${index % 3}`}
                key={photo.id}
              >
                <button
                  type="button"
                  onClick={() => onView(photo)}
                  aria-label={`放大查看${photo.title}`}
                >
                  <Media photo={photo} />
                </button>
                <figcaption>
                  <h3>{photo.title}</h3>
                  <p>{photo.note || "活动名称、时间与个人角色待补充。"}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div className="v2-container v2-practice-footer">
          <p className="v2-practice-hint">
            <span className="v2-hint-native">左右滑动浏览</span>
            <span className="v2-hint-pinned">继续滚动，展开更多现场</span>
          </p>
          <div className="v2-controls v2-practice-controls">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="向左浏览实践照片"
            >
              <CaretLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="向右浏览实践照片"
            >
              <CaretRight aria-hidden="true" />
            </button>
          </div>
          <div className="v2-progress" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}
