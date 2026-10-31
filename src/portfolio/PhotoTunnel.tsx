import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useReducedData } from "@/hooks/useReducedData";
import { Media } from "./Media";
import { GalaxyTrail, type GalaxyController } from "./GalaxyTrail";
import type { Photo } from "./content";
import { heroEffects } from "./hero-effects.config";
import { fadeProgress, projectTunnel, wheelTravel, wrapPhotoIndex } from "./tunnelGeometry";
import { useSceneVisibility } from "./useSceneVisibility";
import { useOpeningReady } from "./useOpeningReady";
import { useCompactTunnel } from "./useCompactTunnel";
import "./photo-tunnel.css";

const config = heroEffects.tunnel;
export const tunnelMotionKey = "csy:tunnel-motion:v1";
type MotionChoice = "system" | "play" | "pause";
function readMotionChoice(): MotionChoice {
  try {
    const saved = localStorage.getItem(tunnelMotionKey);
    if (saved === "play" || saved === "pause") return saved;
  } catch { /* Private browsing may block storage; the control still works. */ }
  return "system";
}
type CachedPhoto = {
  element: HTMLButtonElement;
  ordinal: number;
  width: number;
  height: number;
  opacity: number;
  entryStart: number | null;
  entryFrom: number;
  exitStart: number | null;
};

export function PhotoTunnel({ photos, onView, suspended = false }: {
  photos: Photo[];
  onView: (photo: Photo) => void;
  suspended?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const galaxy = useRef<GalaxyController>(null);
  const initialized = useRef(false);
  const clock = useRef({ seconds: 0, velocity: 0 });
  const cache = useRef<CachedPhoto[]>([]);
  const dimensions = useRef({ width: 760, height: 620 });
  const camera = useRef({ target: 0, position: 0 });
  const [first, setFirst] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [motionChoice, setMotionChoice] = useState<MotionChoice>(readMotionChoice);
  const openingReady = useOpeningReady(root);
  const reduced = useReducedMotion();
  const reducedData = useReducedData();
  const compact = useCompactTunnel();
  const lowResolution = compact || reducedData;
  const still = motionChoice === "pause" || (reduced && motionChoice !== "play");
  const chooseMotion = (choice: MotionChoice) => {
    setMotionChoice(choice);
    try { localStorage.setItem(tunnelMotionKey, choice); } catch { /* Optional persistence. */ }
  };
  const sceneVisible = useSceneVisibility(root);
  const active = sceneVisible && !suspended && openingReady;
  const id = useId();
  // Motion preference changes playback, never the approved depth composition.
  // Manual paging keeps the entire archive reachable without mounting it all.
  const count = Math.min(config.visibleCount, photos.length);
  const ordinals = Array.from({ length: count }, (_, slot) => first + slot);

  const paint = useCallback((progress: number) => {
    const { width, height } = dimensions.current;
    const placements = projectTunnel(cache.current, progress, width, height);
    placements.forEach((placement, index) => {
      const item = cache.current[index];
      const { seconds, velocity } = clock.current;
      // Reverse smoothly out of an already-started outer fade.
      if (velocity < -0.01 && item.exitStart !== null) {
        item.entryFrom = item.opacity;
        item.entryStart = seconds;
        item.exitStart = null;
      }
      const untilExit = (item.ordinal + 1) * config.depthGap - progress;
      const speed = Math.max(config.autoSpeed, velocity);
      if (placement.slot === 0 && velocity > 0.01 && untilExit <= speed * config.exitDuration && item.exitStart === null)
        item.exitStart = seconds - Math.max(0, config.exitDuration - untilExit / speed);
      const arrive = item.entryStart === null ? 1 : item.entryFrom +
        (1 - item.entryFrom) * fadeProgress(seconds - item.entryStart, config.entryDuration);
      const depart = item.exitStart === null ? 1 : 1 - fadeProgress(seconds - item.exitStart, config.exitDuration);
      item.opacity = still ? 1 : arrive * depart;
      item.element.style.transform = `translate3d(${placement.x}px, ${placement.y}px, 0) translate(-50%, -50%) scale(${placement.scale})`;
      item.element.style.zIndex = String(placement.zIndex);
      item.element.style.opacity = String(item.opacity);
      item.element.style.visibility = item.opacity < 0.01 ? "hidden" : "visible";
    });
    galaxy.current?.paint(progress, clock.current.seconds);
    stage.current?.setAttribute("data-travel", progress.toFixed(1));
  }, [still]);

  const collect = useCallback(() => {
    if (!stage.current) return;
    const width = stage.current.clientWidth || 760;
    const height = stage.current.clientHeight || 620;
    dimensions.current = { width, height };
    const factor = width / config.referenceWidth;
    root.current?.style.setProperty("--tunnel-feather", `${config.feather * factor}px`);
    root.current?.style.setProperty("--tunnel-photo-radius", `${config.photoRadius * factor}px`);
    galaxy.current?.resize(width, height);
    const previous = new Map(cache.current.map((item) => [item.ordinal, item]));
    cache.current = [...stage.current.querySelectorAll<HTMLButtonElement>(".v2-tunnel-photo")].map((element) => {
      const ordinal = Number(element.dataset.ordinal);
      const photo = photos[wrapPhotoIndex(ordinal, photos.length)];
      const aspect = (photo.width || 900) / (photo.height || 1600);
      const photoHeight = Math.min(config.photoMaxHeight, config.photoMaxWidth / aspect) * factor;
      const photoWidth = photoHeight * aspect;
      // Dimensions change only on mount/resize, never inside the animation loop.
      element.style.width = `${photoWidth}px`;
      element.style.height = `${photoHeight}px`;
      const old = previous.get(ordinal);
      return { element, ordinal, width: photoWidth, height: photoHeight,
        opacity: still ? 1 : old?.opacity ?? (initialized.current ? 0 : 1),
        entryStart: still ? null : old ? old.entryStart : initialized.current ? clock.current.seconds : null,
        entryFrom: old?.entryFrom ?? 0, exitStart: still ? null : old?.exitStart ?? null };
    });
    initialized.current = true;
    paint(camera.current.position);
  }, [photos, still, paint]);

  useLayoutEffect(() => collect(), [collect, first, lowResolution]);
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", collect);
      return () => window.removeEventListener("resize", collect);
    }
    const observer = new ResizeObserver(collect);
    observer.observe(element);
    return () => observer.disconnect();
  }, [collect]);

  const travel = useCallback((delta: number) => {
    if (suspended || !photos.length) return;
    camera.current.target += delta;
    if (still || !active) {
      camera.current.position = camera.current.target;
      setFirst(Math.floor(camera.current.position / config.depthGap));
      paint(camera.current.position);
    }
  }, [suspended, photos.length, still, active, paint]);
  useEffect(() => {
    const element = stage.current;
    if (!element || still) return;
    const onWheel = (event: WheelEvent) => {
      if (!active || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      travel(wheelTravel(event.deltaY, event.deltaMode, dimensions.current.height));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [active, still, travel]);
  useEffect(() => {
    if (!active) camera.current.target = camera.current.position;
  }, [active]);
  useEffect(() => {
    if (!active || still || !photos.length) return;
    let frame = 0;
    let last = performance.now();
    let lastFirst = Math.floor(camera.current.position / config.depthGap);
    const tick = (now: number) => {
      if (lowResolution && now - last < 1000 / heroEffects.mobile.tunnelFps - 0.1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const seconds = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      clock.current.seconds += seconds;
      if (!hovered && !focused) camera.current.target += config.autoSpeed * seconds;
      const alpha = 1 - (1 - config.smoothing) ** (seconds * 60);
      const previousPosition = camera.current.position;
      camera.current.position += (camera.current.target - camera.current.position) * alpha;
      clock.current.velocity = seconds > 0 ? (camera.current.position - previousPosition) / seconds : 0;
      const nextFirst = Math.floor(camera.current.position / config.depthGap);
      if (nextFirst !== lastFirst) {
        lastFirst = nextFirst;
        setFirst(nextFirst);
      }
      paint(camera.current.position);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [active, still, photos.length, hovered, focused, paint, lowResolution]);

  const cssVariables = {
    "--tunnel-feather": `${config.feather}px`,
    "--tunnel-photo-radius": `${config.photoRadius}px`,
    "--tunnel-photo-opacity": config.photoOpacity,
    "--tunnel-background-blur": `${config.backgroundBlur}px`,
    "--tunnel-background-shade": config.backgroundShade,
    "--tunnel-center-y": `${config.centerY * 100}%`,
    "--galaxy-field-opacity": heroEffects.galaxy.fieldOpacity,
    "--galaxy-stream-opacity": heroEffects.galaxy.streamOpacity,
  } as CSSProperties;
  return (
    <div ref={root} className="v2-tunnel-region" role="region" aria-label="首页照片墙"
      style={cssVariables} data-motion={still ? "paused" : "playing"} data-quality={lowResolution ? "mobile" : "desktop"}
      onPointerEnter={(event) => { if (event.pointerType !== "touch") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={(event) => { if (stage.current?.contains(event.target)) setFocused(true); }}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div ref={stage} className="v2-tunnel-stage" tabIndex={0}
        aria-label="螺旋照片隧道" aria-describedby={`${id}-hint`}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            travel(event.key === "ArrowUp" ? config.depthGap : -config.depthGap);
          }
        }}>
        <div className="v2-tunnel-atmosphere" aria-hidden="true" />
        <GalaxyTrail ref={galaxy} lowResolution={lowResolution} />
        {ordinals.map((ordinal) => {
          const photo = photos[wrapPhotoIndex(ordinal, photos.length)];
          return <button key={ordinal} type="button" className="v2-tunnel-photo" data-ordinal={ordinal}
            aria-label={`放大查看${photo.title}`} onClick={() => onView(photo)}>
            <Media photo={{ ...photo, src: (lowResolution && photo.mobileThumbnail) || photo.thumbnail || photo.src }} contain eager />
          </button>;
        })}
        {!photos.length && <p className="v2-empty">首页照片待补充。</p>}
      </div>
      {(reduced || motionChoice !== "system") && <div className="v2-tunnel-playback" aria-label="纵深影像播放">
        <button type="button" onClick={() => travel(-config.depthGap * count)} aria-label="查看上一组隧道照片">上一组</button>
        <button type="button" className="v2-tunnel-play-toggle" aria-pressed={!still}
          onClick={() => { chooseMotion(still ? "play" : "pause"); setHovered(false); setFocused(false); }}>
          {still ? "播放纵深隧道" : "暂停纵深隧道"}
        </button>
        <button type="button" onClick={() => travel(config.depthGap * count)} aria-label="查看下一组隧道照片">下一组</button>
      </div>}
      <p id={`${id}-hint`} className="v2-tunnel-accessible-hint">
        {still ? "纵深照片静止展示，可切换上一组、下一组，或点按播放。点击图片放大。" : "上滑或上方向键前进，下滑或下方向键后退。悬停或聚焦暂停自动推进，移开鼠标后继续。点击图片放大。"}
      </p>
    </div>
  );
}
