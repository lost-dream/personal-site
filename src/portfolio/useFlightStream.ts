import { useEffect, useRef, type RefObject } from "react";
import type Hls from "hls.js";

/** Small independent segments avoid Pages' lack of byte-range delivery. */
export function useFlightStream(videoRef: RefObject<HTMLVideoElement | null>, url: string | undefined,
  enabled: boolean, native: boolean, visible: boolean, reduced: boolean, suspended: boolean,
  onFallback: () => void) {
  const controller = useRef<Hls | null>(null);
  const wantsData = useRef(false);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => {
      wantsData.current = visible && !document.hidden && !suspended && (!reduced || !video.paused);
      if (wantsData.current) controller.current?.startLoad();
      else controller.current?.stopLoad();
    };
    const manualPlay = () => {
      if (visible && !document.hidden && !suspended) { wantsData.current = true; controller.current?.startLoad(); }
    };
    const pause = () => { wantsData.current = false; controller.current?.stopLoad(); };
    update();
    video.addEventListener("play", manualPlay);
    video.addEventListener("pause", pause);
    document.addEventListener("visibilitychange", update);
    return () => {
      video.removeEventListener("play", manualPlay);
      video.removeEventListener("pause", pause);
      document.removeEventListener("visibilitychange", update);
    };
  }, [videoRef, visible, reduced, suspended, enabled]);

  useEffect(() => {
    const video = videoRef.current;
    if (!enabled || !url || !video) return;
    if (native) {
      video.src = url;
      return () => { video.removeAttribute("src"); video.load(); };
    }
    let cancelled = false;
    let instance: Hls | undefined;
    void import("hls.js/light").then(({ default: Player }) => {
      if (cancelled) return;
      if (!Player.isSupported()) { onFallback(); return; }
      instance = new Player({ autoStartLoad: false, maxBufferLength: 6, maxMaxBufferLength: 10,
        backBufferLength: 4, maxBufferSize: 4 * 1024 * 1024, enableWorker: true });
      controller.current = instance;
      instance.on(Player.Events.ERROR, (_event, data) => {
        if (data.fatal && !cancelled) {
          console.warn("Video stream fallback:", data.details, data.error?.message || "");
          onFallback();
        }
      });
      instance.attachMedia(video);
      instance.loadSource(url);
      if (wantsData.current && !document.hidden) instance.startLoad();
    }).catch(() => { if (!cancelled) onFallback(); });
    return () => {
      cancelled = true;
      instance?.destroy();
      if (controller.current === instance) controller.current = null;
    };
  }, [videoRef, url, enabled, native, onFallback]);
}
