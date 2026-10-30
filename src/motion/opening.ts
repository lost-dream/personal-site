import { createScope, createTimeline, stagger } from 'animejs';

export function installOpeningMotion(root: HTMLElement, reduced: boolean) {
  if (reduced) return () => undefined;

  const scope = createScope({ root });
  let setupFailed = false;
  let setupError: unknown;

  scope.add(() => {
    try {
      createTimeline({ defaults: { ease: 'outExpo' } })
        .add('[data-opening-curtain]', {
          scaleX: [1, 0],
          transformOrigin: 'right',
          duration: 1350,
        })
        .add(
          '[data-opening-title]',
          {
            x: ['20vw', 0],
            y: ['110%', 0],
            scaleX: [0.68, 1],
            opacity: [0, 1],
            duration: 1300,
            delay: stagger(120),
          },
          260,
        )
        .add(
          '[data-opening-copy]',
          { y: [24, 0], opacity: [0, 1], duration: 900, delay: stagger(100) },
          880,
        )
        .add('[data-opening-nav]', { y: [-18, 0], opacity: [0, 1], duration: 780 }, 980);
    } catch (error) {
      setupFailed = true;
      setupError = error;
    }
  });

  if (setupFailed) {
    scope.revert();
    throw setupError;
  }

  return () => scope.revert();
}
