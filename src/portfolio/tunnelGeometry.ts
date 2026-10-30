import { heroEffects } from "./hero-effects.config";

export const wrapPhotoIndex = (index: number, count: number) =>
  count > 0 ? ((index % count) + count) % count : 0;

export function wheelTravel(delta: number, mode: number, height: number) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? height : 1);
  return -Math.max(-320, Math.min(320, pixels)) * heroEffects.tunnel.wheelSensitivity;
}

type TunnelItem = { ordinal: number; width: number; height: number };
export type TunnelPlacement = TunnelItem & { x: number; y: number; scale: number; opacity: number; slot: number; zIndex: number };

/** Smoothstep timing used by the approved standalone preview. */
export function fadeProgress(elapsed: number, duration: number) {
  const t = Math.max(0, Math.min(1, elapsed / duration));
  return t * t * (3 - 2 * t);
}

export function spiralPoint(rank: number, width: number, height: number, extend = true) {
  const config = heroEffects.tunnel;
  const remaining = 1 - Math.max(0, Math.min(1, rank / (config.visibleCount - 1)));
  const radius = config.innerRadius + (1 - config.innerRadius) * remaining ** config.radiusPower +
    (extend && rank < 0 ? config.outerExtension * (-rank) ** config.outerExtensionPower : 0);
  const angle = (-90 - config.direction * rank * config.angleStep) * Math.PI / 180;
  return { x: Math.cos(angle) * width * config.radiusX * radius,
    y: Math.sin(angle) * height * config.radiusY * radius + height * (config.centerY - 0.5) };
}

/** Exact continuous depth curve from 支线2; no collision impulses or size clamps. */
export function projectTunnel(items: TunnelItem[], progress: number, width: number, height: number) {
  const config = heroEffects.tunnel;
  const first = Math.floor(progress / config.depthGap);
  return items.map((item) => {
    const rank = item.ordinal - progress / config.depthGap;
    const remaining = 1 - Math.max(0, Math.min(1, rank / (config.visibleCount - 1)));
    const scale = config.minimumScale + (1 - config.minimumScale) * remaining ** config.scalePower;
    const slot = item.ordinal - first;
    return { ...item, ...spiralPoint(rank, width, height), scale, opacity: 1,
      slot, zIndex: config.visibleCount + 1 - slot };
  });
}
