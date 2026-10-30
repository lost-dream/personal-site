import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Photo } from "./content";
import { useNearViewport } from "./useNearViewport";
import { useFlightStream } from "./useFlightStream";

/** Native controls stay available if autoplay is blocked or motion is reduced. */
export function FlightVideo({ photo, suspended = false }: { photo: Photo; suspended?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [mobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");
  const [nativeHls] = useState(() => typeof MediaSource === "undefined" && Boolean(document.createElement("video").canPlayType("application/vnd.apple.mpegurl")));
  const [fallback, setFallback] = useState(false);
  const fallbackToFile = useCallback(() => setFallback(true), []);
  const near = useNearViewport(ref, "400px");
  // Choose once: resizing must not fetch a second copy or reset playback.
  const source = near ? (mobile ? photo.mobileSrc || photo.src : photo.src) : undefined;
  const playlist = mobile ? photo.mobileHlsSrc || photo.hlsSrc : photo.hlsSrc;
  const streaming = Boolean(playlist && !fallback && (nativeHls || typeof MediaSource !== "undefined"));
  useFlightStream(ref, playlist, near && streaming, nativeHls, visible, reduced, suspended, fallbackToFile);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = typeof IntersectionObserver === "undefined" ? null :
      new IntersectionObserver(([entry]) => {
        setVisible(entry.isIntersecting);
      }, { threshold: 0.1 });
    if (observer) observer.observe(video);
    return () => observer?.disconnect();
  }, [streaming]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !source) return;
    const update = () => {
      if (visible && !document.hidden && !reduced && !suspended) {
        void video.play()?.catch(() => undefined);
      } else {
        video.pause();
      }
    };
    update();
    document.addEventListener("visibilitychange", update);
    video.addEventListener("loadeddata", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      video.removeEventListener("loadeddata", update);
      video.pause();
    };
  }, [source, visible, reduced, suspended, streaming]);

  return <div className="v2-flight-media" style={{ aspectRatio: `${photo.width || 16} / ${photo.height || 9}` }}>
    <video
      key={streaming ? "stream" : "file"}
      ref={ref}
      src={streaming ? undefined : source}
      poster={near ? photo.poster : undefined}
      width={photo.width}
      height={photo.height}
      aria-label={photo.title}
      autoPlay={visible && !reduced && !suspended}
      muted
      loop
      playsInline
      controls
      preload={source ? "metadata" : "none"}
      onError={() => { if (streaming) fallbackToFile(); else setFailed(true); }}
    >
      {photo.captions && <track kind="captions" src={photo.captions} srcLang="zh" label="中文字幕" default />}
      你的浏览器暂不支持视频播放。
    </video>
    {failed && <p className="v2-flight-error" role="status">视频暂时无法播放，请刷新后重试。</p>}
  </div>;
}
