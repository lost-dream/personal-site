import { animate, stagger } from 'animejs';

const ITEM_START = 760;
const ITEM_STAGGER = 120;
const MEDIA_AFTER_ITEMS = 320;

export function installSectionReveals(root: HTMLElement, reduced: boolean) {
  if (reduced) return () => undefined;

  let active = true;
  const animations: ReturnType<typeof animate>[] = [];
  const sections = root.querySelectorAll<HTMLElement>('main > section:not(#home)');
  let observer: IntersectionObserver;

  const reset = () => {
    if (!active) return;
    active = false;
    root.classList.remove('motion-ready');
    try {
      observer.disconnect();
    } catch {
      // Cleanup remains fail-open even if an observer implementation misbehaves.
    }
    for (const animation of animations.splice(0).reverse()) {
      try {
        animation.revert();
      } catch {
        // One failed animation must not strand later cleanup work.
      }
    }
    sections.forEach((section) => delete section.dataset.revealed);
  };

  observer = new IntersectionObserver(
    (entries) => {
      if (!active) return;

      for (const entry of entries) {
        if (!active) break;
        if (!entry.isIntersecting) continue;

        try {
          const section = entry.target as HTMLElement;
          if (section.dataset.revealed === 'true') continue;

          section.dataset.revealed = 'true';
          const title = section.querySelector('[data-reveal-title]');
          const items = section.querySelectorAll('[data-reveal-item]');
          const mediaWipes = section.querySelectorAll('[data-media-wipe]');
          const mediaStart =
            ITEM_START + Math.max(0, items.length - 1) * ITEM_STAGGER + MEDIA_AFTER_ITEMS;

          if (title) {
            animations.push(
              animate(title, {
                x: ['22vw', 0],
                scaleX: [0.7, 1],
                opacity: [0, 1],
                duration: 1200,
                ease: 'outExpo',
              }),
            );
          }
          if (items.length) {
            animations.push(
              animate(items, {
                y: [54, 0],
                opacity: [0, 1],
                duration: 950,
                delay: stagger(ITEM_STAGGER, { start: ITEM_START }),
                ease: 'outQuart',
              }),
            );
          }
          if (mediaWipes.length) {
            animations.push(
              animate(mediaWipes, {
                scaleX: [1, 0],
                duration: 1100,
                delay: stagger(100, { start: mediaStart }),
                ease: 'inOutQuart',
              }),
            );
          }
          observer.unobserve(section);
        } catch {
          reset();
        }
      }
    },
    // Section height is content-dependent; a fractional threshold can be unreachable.
    { threshold: 0 },
  );

  sections.forEach((section) => observer.observe(section));

  return reset;
}
