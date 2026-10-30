import { useEffect, useState } from "react";
import type { Photo } from "./content";

export function Media({
  photo,
  contain = false,
  eager = false,
  onReady,
}: {
  photo: Photo;
  contain?: boolean;
  eager?: boolean;
  onReady?: () => void;
}) {
  return (
    <MediaImage
      key={`${photo.id}-${photo.src}-${photo.poster}`}
      photo={photo}
      contain={contain}
      eager={eager}
      onReady={onReady}
    />
  );
}

function MediaImage({
  photo,
  contain,
  eager,
  onReady,
}: {
  photo: Photo;
  contain: boolean;
  eager: boolean;
  onReady?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const src = photo.kind === "video" ? photo.poster : photo.src;
  useEffect(() => { if (!src) onReady?.(); }, [src, onReady]);
  return (
    <div
      className={`v2-media ${contain ? "is-contained" : ""}`}
      data-empty={!src || failed ? "" : undefined}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={photo.alt || photo.title}
          width={photo.width || 1600}
          height={photo.height || 1200}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={onReady}
          onError={() => { setFailed(true); onReady?.(); }}
        />
      ) : (
        <div
          className="v2-placeholder"
          role="img"
          aria-label={`${photo.title}，蓝色图片占位`}
        >
          <span>{photo.title}</span>
          <small>{failed ? "图片暂不可用" : "图片待补充"}</small>
        </div>
      )}
    </div>
  );
}
