export type MosaicPhoto = { file: string; source: string; width: number; height: number };
export const worksMosaicConfig = {
  gapPx: 0,
  bleedPx: 12,
  featherPx: 5,
  blurPx: 5,
  radiusPx: 8,
  targetRowWidthFactor: 0.28,
  minRowHeightPx: 220,
  maxRowHeightPx: 480,
  edgeFadePx: 180,
} as const;

/** Grow proportionally past the logical cell so feather/blur never expose seams. */
export function expandWorksMosaicPhoto(tile: { x: number; y: number; width: number; height: number }) {
  const scale = 1 + worksMosaicConfig.bleedPx * 2 / Math.min(tile.width, tile.height);
  const width = tile.width * scale;
  const height = tile.height * scale;
  return { x: tile.x - (width - tile.width) / 2, y: tile.y - (height - tile.height) / 2, width, height };
}

/** Deterministic interleaving, so portrait and landscape photos are not segregated. */
export function orderWorksMosaicPhotos(photos: MosaicPhoto[]) {
  const ordered = [...photos];
  let seed = 20261029;
  for (let i = ordered.length - 1; i > 0; i -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  }
  return ordered;
}

/** Justified rows fill the width without stretching/cropping individual subjects. */
export function layoutWorksMosaic(photos: MosaicPhoto[], width: number, height: number) {
  const tiles: Array<{ photo: MosaicPhoto; x: number; y: number; width: number; height: number }> = [];
  if (!photos.length || width <= 0 || height <= 0) return tiles;
  const gap = worksMosaicConfig.gapPx;
  const target = Math.max(worksMosaicConfig.minRowHeightPx, Math.min(worksMosaicConfig.maxRowHeightPx, width * worksMosaicConfig.targetRowWidthFactor));
  let y = 0;
  let cursor = 0;
  // At most 160 rows, including very narrow/tall displays; no frame loop.
  for (let row = 0; y < height && row < 160; row += 1) {
    const items: MosaicPhoto[] = [];
    let aspectSum = 0;
    do {
      const photo = photos[cursor % photos.length];
      items.push(photo);
      aspectSum += photo.width / photo.height;
      cursor += 1;
    } while ((width - gap * (items.length - 1)) / aspectSum > target && items.length < 8);
    const rowHeight = (width - gap * (items.length - 1)) / aspectSum;
    let x = 0;
    items.forEach((photo) => {
      const tileWidth = rowHeight * photo.width / photo.height;
      tiles.push({ photo, x, y, width: tileWidth, height: rowHeight });
      x += tileWidth + gap;
    });
    y += rowHeight + gap;
  }
  return tiles;
}
