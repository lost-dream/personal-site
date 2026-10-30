import { useEffect, type RefObject } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function usePortfolioMotion(root: RefObject<HTMLDivElement | null>) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!root.current || reduced) return;

    const current = root.current;
    let active = true;
    let disposeOpening: (() => void) | undefined;
    let disposeInteractions: (() => void) | undefined;
    let disposeReveals: (() => void) | undefined;
    let disposeScroll: (() => void) | undefined;
    const disposeAll = () => {
      const disposers = [disposeOpening, disposeInteractions, disposeReveals, disposeScroll];
      disposeOpening = undefined;
      disposeInteractions = undefined;
      disposeReveals = undefined;
      disposeScroll = undefined;
      for (const dispose of disposers) {
        try {
          dispose?.();
        } catch {
          // Continue cleanup so one motion system cannot strand the others.
        }
      }
    };

    void Promise.all([
      import('@/motion/opening'),
      import('@/motion/interactionFeedback'),
      import('@/motion/sectionReveal'),
      import('@/motion/scrollScenes'),
    ])
      .then(
        ([
          { installOpeningMotion },
          { installInteractionFeedback },
          { installSectionReveals },
          { installScrollScenes },
        ]) => {
          if (!active) return;

          current.classList.add('motion-ready');
          try {
            disposeOpening = installOpeningMotion(current, reduced);
            disposeInteractions = installInteractionFeedback(current, reduced);
            disposeReveals = installSectionReveals(current, reduced);
            disposeScroll = installScrollScenes(current, reduced);
          } catch {
            current.classList.remove('motion-ready');
            disposeAll();
          }
        },
      )
      .catch(() => {
        if (active) {
          current.classList.remove('motion-ready');
        }
      });

    return () => {
      active = false;
      current.classList.remove('motion-ready');
      disposeAll();
    };
  }, [reduced, root]);
}
