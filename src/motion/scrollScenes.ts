import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function installScrollScenes(root: HTMLElement, reduced: boolean) {
  if (reduced) {
    return () => undefined;
  }

  let media: ReturnType<typeof gsap.matchMedia> | undefined;

  try {
    media = gsap.matchMedia();
    media.add('(min-width: 1024px)', () => installDesktopProjectScenes(root));
    return () => media?.revert();
  } catch {
    media?.revert();
    return () => undefined;
  }
}

function installDesktopProjectScenes(root: HTMLElement) {
  let context: ReturnType<typeof gsap.context> | undefined;
  let rebuilding = false;
  const fitsViewport = (card: HTMLElement) =>
    Math.max(card.offsetHeight, card.scrollHeight) <= window.innerHeight + 1;

  const build = () => {
    let setupFailed = false;
    context = gsap.context(() => {
      try {
        const cards = gsap.utils.toArray<HTMLElement>('[data-gsap-project-card]');
        const fitting = cards.map(fitsViewport);

        cards.slice(0, -1).forEach((card, index) => {
          if (!fitting[index]) return;
          ScrollTrigger.create({
            trigger: card,
            start: 'top top',
            endTrigger: cards[cards.length - 1],
            end: 'top top',
            pin: true,
            pinSpacing: false,
          });
          gsap.to(card, {
            scale: 0.93,
            opacity: 0.48,
            ease: 'none',
            scrollTrigger: {
              trigger: cards[index + 1],
              start: 'top bottom',
              end: 'top top',
              scrub: 1,
            },
          });
        });

        gsap.utils.toArray<HTMLElement>('[data-gsap-parallax]').forEach((wrapper) => {
          gsap.to(wrapper, {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: wrapper,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          });
        });
      } catch {
        setupFailed = true;
      }
    }, root);
    if (setupFailed) throw new Error('Project scene setup failed');
  };

  // refreshInit runs before ScrollTrigger removes pin sizing. Always restore our
  // natural layout before measuring; a pinned width can conceal new text wrapping.
  // Rebuild inside this refresh pass, without requesting another global refresh.
  const refresh = () => {
    if (rebuilding) return;
    rebuilding = true;
    try {
      context?.revert();
      build();
    } catch {
      context?.revert();
      ScrollTrigger.removeEventListener('refreshInit', refresh);
    } finally {
      rebuilding = false;
    }
  };

  try {
    build();
    ScrollTrigger.addEventListener('refreshInit', refresh);
    return () => {
      ScrollTrigger.removeEventListener('refreshInit', refresh);
      context?.revert();
    };
  } catch {
    context?.revert();
    return () => undefined;
  }
}
