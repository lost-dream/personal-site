import { forwardRef, useImperativeHandle, useRef } from "react";
import { heroEffects } from "./hero-effects.config";
import { spiralPoint } from "./tunnelGeometry";

const settings = heroEffects.galaxy;
const widthBase = heroEffects.tunnel.referenceWidth;
const heightBase = 1000;
const rankMax = heroEffects.tunnel.visibleCount - 1;
let seed = 20261006;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const dust = Array.from({ length: settings.dustCount }, () => ({ rank: random() * rankMax,
  offset: (random() + random() + random() - 1.5) * 24, size: 0.4 + random() * 1.3, light: 0.14 + random() * 0.6 }));
const stars = Array.from({ length: settings.starCount }, () => ({ rank: random() * rankMax,
  offset: (random() - 0.5) * 14, size: 0.55 + random() * 0.65, phase: random() * Math.PI * 2 }));
const trackPoint = (rank: number) => {
  const point = spiralPoint(rank, widthBase, heightBase, false);
  return { x: widthBase / 2 + point.x, y: heightBase / 2 + point.y };
};
const starPoint = (rank: number, offset: number) => {
  const point = trackPoint(rank), next = trackPoint(Math.min(rankMax, rank + 0.005));
  const dx = next.x - point.x, dy = next.y - point.y, length = Math.hypot(dx, dy) || 1;
  return { x: point.x - dy / length * offset, y: point.y + dx / length * offset };
};
const colorAt = (rank: number) => rank > 14 ? settings.colors.gold : rank > 7 ? settings.colors.violet : settings.colors.blue;
export type GalaxyController = { resize: (width: number, height: number) => void; paint: (progress: number, seconds: number) => void };

/** The approved two-canvas galaxy, sharing PhotoTunnel's clock (no extra rAF). */
export const GalaxyTrail = forwardRef<GalaxyController, { lowResolution?: boolean }>(function GalaxyTrail({ lowResolution = false }, ref) {
  const field = useRef<HTMLCanvasElement>(null);
  const stream = useRef<HTMLCanvasElement>(null);
  const state = useRef({ factorX: 1, factorY: 1, ratio: 1, lastStars: -Infinity,
    compact: false, fieldContext: null as CanvasRenderingContext2D | null,
    streamContext: null as CanvasRenderingContext2D | null });
  useImperativeHandle(ref, () => {
    const prepare = (context: CanvasRenderingContext2D | null) => {
      if (!context) return null;
      const data = state.current;
      context.setTransform(data.ratio * data.factorX, 0, 0, data.ratio * data.factorY, 0, 0);
      context.clearRect(0, 0, widthBase, heightBase);
      return context;
    };
    const drawField = () => {
      const ctx = prepare(state.current.fieldContext);
      if (!ctx) return;
      const center = { x: widthBase / 2, y: heightBase * heroEffects.tunnel.centerY };
      const core = ctx.createRadialGradient(center.x, center.y, 2, center.x, center.y, 84);
      core.addColorStop(0, `${settings.colors.gold}55`);
      core.addColorStop(0.35, `${settings.colors.core}1a`);
      core.addColorStop(1, `${settings.colors.blue}00`);
      ctx.fillStyle = core;
      ctx.fillRect(420, 440, 245, 240);
      for (const width of [28, 13, 3]) {
        const gradient = ctx.createRadialGradient(center.x, center.y, 20, center.x, center.y, 475);
        gradient.addColorStop(0, `${settings.colors.gold}4d`);
        gradient.addColorStop(0.38, "#aa93cf38");
        gradient.addColorStop(1, `${settings.colors.blue}12`);
        ctx.beginPath();
        for (let step = 0; step <= 380; step++) {
          const point = trackPoint(step / 380 * rankMax);
          if (step) ctx.lineTo(point.x, point.y); else ctx.moveTo(point.x, point.y);
        }
        ctx.strokeStyle = gradient;
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.shadowColor = settings.colors.violet;
        ctx.shadowBlur = width;
        ctx.globalAlpha = width === 3 ? 0.12 : 0.22;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      dust.forEach((star) => {
        const point = starPoint(star.rank, star.offset);
        ctx.globalAlpha = star.light;
        ctx.fillStyle = colorAt(star.rank);
        ctx.beginPath(); ctx.arc(point.x, point.y, star.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    };
    return {
      resize(width, height) {
        if (!field.current || !stream.current || typeof CanvasRenderingContext2D === "undefined") return;
        const data = state.current;
        data.factorX = width / widthBase;
        data.factorY = height / heightBase;
        data.compact = lowResolution;
        const budget = data.compact ? heroEffects.mobile.galaxyMaxPixelCount : settings.maxPixelCount;
        const maxRatio = data.compact ? heroEffects.mobile.galaxyMaxPixelRatio : settings.maxPixelRatio;
        data.ratio = Math.min(maxRatio, Math.sqrt(budget / (width * height)));
        for (const canvas of [field.current, stream.current]) {
          canvas.width = Math.max(1, Math.floor(width * data.ratio));
          canvas.height = Math.max(1, Math.floor(height * data.ratio));
        }
        data.fieldContext = field.current.getContext("2d");
        data.streamContext = stream.current.getContext("2d");
        data.lastStars = -Infinity;
        drawField();
      },
      paint(progress, seconds) {
        const data = state.current;
        if (seconds - data.lastStars < 1 / (data.compact ? heroEffects.mobile.galaxyFps : settings.fps)) return;
        data.lastStars = seconds;
        const ctx = prepare(data.streamContext);
        if (!ctx) return;
        stars.forEach((star, index) => {
          if (data.compact && index % 2) return;
          const rank = ((star.rank - progress / heroEffects.tunnel.depthGap * settings.drift) % rankMax + rankMax) % rankMax;
          const point = starPoint(rank, star.offset);
          ctx.fillStyle = colorAt(rank);
          ctx.globalAlpha = 0.6 + 0.12 * Math.sin(seconds * 0.6 + star.phase);
          ctx.beginPath(); ctx.arc(point.x, point.y, star.size, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
      },
    };
  }, [lowResolution]);
  return <>
    <div className="v2-galaxy-halo" aria-hidden="true" />
    <canvas ref={field} className="v2-galaxy-field" aria-hidden="true" />
    <canvas ref={stream} className="v2-galaxy-stream" aria-hidden="true" />
  </>;
});
