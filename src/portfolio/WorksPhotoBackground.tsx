import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import photos from "./works-mosaic-photos.json";
import { expandWorksMosaicPhoto, layoutWorksMosaic, orderWorksMosaicPhotos, worksMosaicConfig as config } from "./works-photo-mosaic";
import "./works-photo-background.css";

const mosaicPhotos = orderWorksMosaicPhotos(photos);

/** Section-local, static photographic background. Never catches clicks or focus. */
export function WorksPhotoBackground() {
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1280, height: 4000 });
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const update = (width: number, height: number) => {
      const next = { width: Math.round(width), height: Math.round(height) };
      if (next.width > 0 && next.height > 0) setSize((previous) => previous.width === next.width && previous.height === next.height ? previous : next);
    };
    const measure = () => { const rect = node.getBoundingClientRect(); update(rect.width, rect.height); };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width, entry.contentRect.height));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const tiles = useMemo(() => layoutWorksMosaic(mosaicPhotos, size.width, size.height), [size]);
  return <div className="v2-works-photo-background" aria-hidden="true" ref={root} style={{
    "--works-photo-gap": `${config.gapPx}px`, "--works-photo-feather": `${config.featherPx}px`,
    "--works-photo-blur": `${config.blurPx}px`, "--works-photo-radius": `${config.radiusPx}px`,
    "--works-photo-edge-fade": `${config.edgeFadePx}px`,
  } as CSSProperties}>
    {tiles.map((tile, index) => {
      const frame = expandWorksMosaicPhoto(tile);
      return <img key={`${tile.photo.file}-${index}`} className="v2-works-background-photo"
      src={`${import.meta.env.BASE_URL}media/works-mosaic/${tile.photo.file}`}
      width={tile.photo.width} height={tile.photo.height} alt="" draggable={false} loading="lazy" decoding="async"
      style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height }} />;
    })}
    <div className="v2-works-photo-veil" />
  </div>;
}
