import { animate, createScope } from 'animejs';

const INTERACTIVE_SELECTOR = [
  '.wordmark',
  '.desktop-nav a',
  '.mobile-menu nav a',
  '.hero-actions a',
  '.header-contact',
  '.experience-intro > a',
  '.contact-actions > a',
  '.menu-button',
  '.mobile-menu > button',
  '.video-control:not(:disabled)',
].join(',');

type FeedbackState = 'rest' | 'hover' | 'pressed';

export function installInteractionFeedback(root: HTMLElement, reduced: boolean) {
  if (reduced) return () => undefined;

  const scope = createScope({ root });
  const running = new Map<HTMLElement, ReturnType<typeof animate>>();
  let active = true;

  const targetFor = (event: Event) => {
    const origin = event.target;
    if (!(origin instanceof Element)) return null;
    const target = origin.closest<HTMLElement>(INTERACTIVE_SELECTOR);
    return target && root.contains(target) ? target : null;
  };

  const run = (target: HTMLElement, state: FeedbackState) => {
    if (!active) return;

    const values =
      state === 'pressed'
        ? { y: 1, scale: 0.98, duration: 110 }
        : state === 'hover'
          ? { y: -2, scale: 1.01, duration: 180 }
          : { y: 0, scale: 1, duration: 220 };

    try {
      running.get(target)?.cancel();
      scope.add(() => {
        running.set(target, animate(target, { ...values, ease: 'outQuad' }));
      });
    } catch {
      // Static CSS cues remain available if Anime cannot initialize an interaction.
    }
  };

  const enter = (event: PointerEvent) => {
    const target = targetFor(event);
    if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) {
      return;
    }
    run(target, 'hover');
  };
  const leave = (event: PointerEvent) => {
    const target = targetFor(event);
    if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) {
      return;
    }
    run(target, 'rest');
  };
  const press = (event: PointerEvent) => {
    const target = targetFor(event);
    if (target) run(target, 'pressed');
  };
  const release = (event: PointerEvent) => {
    const target = targetFor(event);
    if (target) run(target, event.type === 'pointercancel' ? 'rest' : 'hover');
  };

  root.addEventListener('pointerover', enter);
  root.addEventListener('pointerout', leave);
  root.addEventListener('pointerdown', press);
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);

  return () => {
    active = false;
    root.removeEventListener('pointerover', enter);
    root.removeEventListener('pointerout', leave);
    root.removeEventListener('pointerdown', press);
    root.removeEventListener('pointerup', release);
    root.removeEventListener('pointercancel', release);
    running.clear();
    try {
      scope.revert();
    } catch {
      // Event ownership is already released; static CSS cues remain available.
    }
  };
}
