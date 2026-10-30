/** Shared ambient paper stream for the main works section and its preview. Distances use CSS pixels. */
export const worksBackgroundConfig = {
  batchPeriodMs: 2000,
  imagesPerPeriod: 3,
  poolSize: 24,
  speedViewportPerSecond: 0.09,
  mobileSpeedViewportPerSecond: 0.13,
  widthViewport: 0.11,
  mobileWidthViewport: 0.18,
  maxWidth: 210,
  heightViewport: 0.28,
  maxHeight: 280,
  lanes: [0.14, 0.32, 0.50, 0.68, 0.86],
  laneOrder: [0, 3, 1, 4, 2],
  opacity: 0.34,
  blurPx: 1.5,
  radiusPx: 10,
  featherPx: 10,
  floatPx: 8,
  floatPeriodMs: 9000,
  rotationDeg: 2,
  edgeFadeViewport: 0.1,
  edgePadding: 24,
} as const;

export const emissionIntervalMs = worksBackgroundConfig.batchPeriodMs / worksBackgroundConfig.imagesPerPeriod;

export function posterLayout(sequence: number, viewport: { width: number; height: number }, aspect: number) {
  const c = worksBackgroundConfig;
  const mobile = viewport.width < 600;
  const variation = 0.84 + ((sequence * 37) % 17) / 100;
  const maxHeight = Math.min(c.maxHeight, viewport.height * c.heightViewport);
  const width = Math.min(c.maxWidth, viewport.width * (mobile ? c.mobileWidthViewport : c.widthViewport), maxHeight * aspect) * variation;
  const height = width / aspect;
  const lane = c.lanes[c.laneOrder[sequence % c.laneOrder.length]];
  return {
    width, height,
    top: Math.max(c.edgePadding, Math.min(viewport.height - height - c.edgePadding, viewport.height * lane - height / 2)),
    speed: viewport.width * (mobile ? c.mobileSpeedViewportPerSecond : c.speedViewportPerSecond),
    rotation: (((sequence * 13) % 21) / 10 - 1) * c.rotationDeg,
  };
}

export function posterPosition(ageMs: number, viewportWidth: number, layout: ReturnType<typeof posterLayout>) {
  const c = worksBackgroundConfig;
  const x = viewportWidth + c.edgePadding - ageMs / 1000 * layout.speed;
  // Constant-speed travel is intentional; easing a looping conveyor would make it surge.
  const edgeFade = Math.min(1,
    Math.max(0, (viewportWidth - x) / (viewportWidth * c.edgeFadeViewport)),
    Math.max(0, (x + layout.width) / (viewportWidth * c.edgeFadeViewport)));
  return { x, opacity: c.opacity * edgeFade, expired: x + layout.width < -c.edgePadding };
}
