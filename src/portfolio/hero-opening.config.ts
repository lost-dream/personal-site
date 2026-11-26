/** The film advances on its native ended event; these durations start afterwards. */
export const heroOpeningMotion = {
  freezeMs: 600,
  tunnelRevealMs: 1600,
  tunnelHoldMs: 500,
  filmFadeMs: 1100,
  contentRevealMs: 1400,
  mediaTimeoutMs: 14000,
} as const;

export const heroOpeningMedia = {
  video: `${import.meta.env.BASE_URL}media/hero-opening/light-rebuild-v4-web.mp4`,
  endFrame: `${import.meta.env.BASE_URL}media/hero-opening/light-rebuild-v4-end.webp`,
} as const;
