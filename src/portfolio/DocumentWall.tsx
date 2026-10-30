import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useReducedData } from "@/hooks/useReducedData";
import { Media } from "./Media";
import type { Photo } from "./content";
import { useSceneVisibility } from "./useSceneVisibility";
import { useNearViewport } from "./useNearViewport";
import { documentWallMotion } from "./document-wall.config";
import "./document-wall.css";

type Dissolve = { from: Photo; to: Photo; token: number; ready: boolean };

export function DocumentWall({ photos, title, onView, suspended = false, autoPaused = false, intervalMs = documentWallMotion.interval }: {
  photos: Photo[]; title: string; onView: (photo: Photo) => void; suspended?: boolean; autoPaused?: boolean; intervalMs?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const serial = useRef(0);
  const queued = useRef(0);
  const dissolveRef = useRef<Dissolve | null>(null);
  const [index, setIndex] = useState(0);
  const [dissolve, setDissolve] = useState<Dissolve | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [requested, setRequested] = useState(false);
  const visible = useSceneVisibility(root);
  const mediaReady = useNearViewport(root);
  const reduced = useReducedMotion();
  const saveData = useReducedData();
  const animate = !reduced && !saveData;
  const moving = !suspended && !autoPaused && !hovered && !focused && visible && animate;
  const auto = moving && photos.length > 1;
  const wrap = useCallback((value: number) => photos.length ? ((value % photos.length) + photos.length) % photos.length : 0, [photos.length]);
  const go = useCallback((delta: number) => {
    if (suspended || photos.length < 2) return;
    setRequested(true);
    // Fast repeated presses are coalesced after the current dissolve; at most
    // two layers exist and an in-progress image never jumps to full opacity.
    if (dissolveRef.current) { queued.current += delta; return; }
    const from = photos[wrap(indexRef.current)];
    const next = wrap(indexRef.current + delta);
    if (next === wrap(indexRef.current)) return;
    indexRef.current = next;
    setIndex(next);
    if (animate) {
      const transition = { from, to: photos[next], token: ++serial.current, ready: false };
      dissolveRef.current = transition;
      setDissolve(transition);
    }
  }, [photos, wrap, suspended, animate]);
  const finish = useCallback((token: number) => {
    if (dissolveRef.current?.token !== token) return;
    dissolveRef.current = null;
    setDissolve(null);
    const delta = queued.current;
    queued.current = 0;
    if (delta) go(delta);
  }, [go]);
  const incomingToken = dissolve?.token;
  const incomingReady = useCallback(() => {
    const active = dissolveRef.current;
    if (!active || active.token !== incomingToken || active.ready) return;
    dissolveRef.current = { ...active, ready: true };
    setDissolve(dissolveRef.current);
  }, [incomingToken]);
  useEffect(() => {
    if (!dissolve?.ready) return;
    const timeout = window.setTimeout(() => finish(dissolve.token), animate ? documentWallMotion.duration : 0);
    return () => window.clearTimeout(timeout);
  }, [dissolve, finish, animate]);
  useEffect(() => {
    if (!auto || dissolve) return;
    // A fresh dwell begins only after the loaded-image dissolve completes.
    // Manual transitions cancel the previous dwell instead of queuing autoplay.
    const timeout = window.setTimeout(() => {
      if (!dissolveRef.current) go(1);
    }, intervalMs);
    return () => window.clearTimeout(timeout);
  }, [auto, dissolve, go, intervalMs]);
  useEffect(() => {
    if (photos.length < 2 || saveData || !visible || suspended) return;
    // Only neighbours are preloaded, not every full-resolution PDF page.
    for (const delta of [-1, 1]) {
      const source = photos[wrap(index + delta)].src;
      if (source) { const image = new Image(); image.src = source; }
    }
  }, [photos, wrap, index, saveData, visible, suspended]);
  useEffect(() => {
    // Recover safely if a content update removes the currently displayed page.
    indexRef.current = wrap(indexRef.current);
    setIndex(indexRef.current);
    dissolveRef.current = null;
    queued.current = 0;
    setDissolve(null);
  }, [photos, wrap]);
  const current = dissolve ? (dissolve.ready ? dissolve.to : dissolve.from) : photos[wrap(index)];
  const layers = dissolve ? [
    { photo: dissolve.from, phase: dissolve.ready ? "outgoing" : "active", hidden: dissolve.ready },
    { photo: dissolve.to, phase: dissolve.ready ? "incoming" : "waiting", hidden: !dissolve.ready },
  ] : current ? [{ photo: current, phase: "active", hidden: false }] : [];
  return <div ref={root} className="v2-wall v2-wall-document v2-document-wall" role="region"
    aria-label={title} aria-roledescription="照片轮播" data-drifting={moving}
    style={{ "--document-dissolve-duration": `${documentWallMotion.duration}ms`,
      "--document-dissolve-ease": documentWallMotion.easing } as CSSProperties}
    onPointerEnter={(event) => { if (event.pointerType !== "touch") setHovered(true); }}
    onPointerLeave={() => setHovered(false)} onFocusCapture={() => { setFocused(true); setRequested(true); }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className="v2-document-stage" onKeyDown={(event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault(); go(event.key === "ArrowLeft" ? -1 : 1);
      }
    }}>
      {current ? <button className="v2-wall-tile tile-0" type="button" aria-label={`放大查看${current.title}`}
        onClick={() => onView(current)}>
        <div className="v2-document-layers">
          {layers.map((layer) => <div key={layer.photo.id} className="v2-document-layer" data-phase={layer.phase}
            aria-hidden={layer.hidden || undefined} onAnimationEnd={(event) => {
              if (event.target === event.currentTarget && layer.phase === "incoming" && dissolve) finish(dissolve.token);
            }}>
            {mediaReady || requested ? <Media photo={layer.photo} contain eager
              onReady={dissolve && layer.photo.id === dissolve.to.id ? incomingReady : undefined} /> :
              <div className="v2-media is-contained" aria-hidden="true" />}
          </div>)}
        </div>
      </button> : <p className="v2-empty">{title}照片待补充。</p>}
      {photos.length > 1 && <>
        <button className="v2-document-arrow arrow-left" type="button" aria-label={`${title}上一张`}
          disabled={suspended} onClick={() => go(-1)}><CaretLeft aria-hidden="true" /></button>
        <button className="v2-document-arrow arrow-right" type="button" aria-label={`${title}下一张`}
          disabled={suspended} onClick={() => go(1)}><CaretRight aria-hidden="true" /></button>
      </>}
    </div>
    {current && <p className="v2-document-announcement" aria-live={auto ? "off" : "polite"}>{current.title}</p>}
  </div>;
}
