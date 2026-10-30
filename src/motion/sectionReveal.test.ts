import { beforeEach, expect, it, vi } from 'vitest';
import { installSectionReveals } from './sectionReveal';

const mocks = vi.hoisted(() => {
  const animationRevert = vi.fn();
  return {
    animationRevert,
    animate: vi.fn((_targets: unknown, _parameters: unknown) => ({ revert: animationRevert })),
    stagger: vi.fn((value: number, _parameters: { start: number }) => value),
  };
});

const disconnect = vi.fn();
const observe = vi.fn();
const unobserve = vi.fn();
let observerCallback: IntersectionObserverCallback;
let observerOptions: IntersectionObserverInit | undefined;
class ObserverMock {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    observerCallback = callback;
    observerOptions = options;
  }

  observe = observe;
  unobserve = unobserve;
  disconnect = disconnect;
}
vi.stubGlobal('IntersectionObserver', ObserverMock);

vi.mock('animejs', () => mocks);

beforeEach(() => vi.clearAllMocks());

function createRevealSection() {
  const root = document.createElement('div');
  const main = document.createElement('main');
  const section = document.createElement('section');
  section.id = 'experience';
  section.innerHTML = [
    '<h2 data-reveal-title>标题</h2>',
    '<article data-gsap-project-card><div data-reveal-item>内容一</div></article>',
    '<div data-reveal-item>内容二</div>',
    '<div data-gsap-parallax><div class="media-placeholder"><span data-media-wipe></span></div></div>',
  ].join('');
  main.append(section);
  root.append(main);
  return { root, section };
}

function intersect(section: HTMLElement) {
  observerCallback([entryFor(section, true)], {} as IntersectionObserver);
}

function entryFor(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  const bounds = target.getBoundingClientRect();
  return {
    boundingClientRect: bounds,
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: bounds,
    isIntersecting,
    rootBounds: null,
    target,
    time: 0,
  };
}

it('reveals a tall section when only a small fraction can enter the viewport', () => {
  const { root, section } = createRevealSection();
  installSectionReveals(root, false);
  // A 10,000px section in a 1,000px viewport can expose at most 10% of its area.
  const threshold = Math.min(...[observerOptions?.threshold ?? 0].flat());
  if (threshold <= 0.1) {
    observerCallback([{ ...entryFor(section, true), intersectionRatio: 0.1 }], {} as IntersectionObserver);
  }
  expect(section).toHaveAttribute('data-revealed', 'true');
});

it('does not observe in reduced motion', () => {
  installSectionReveals(document.createElement('div'), true)();
  expect(observe).not.toHaveBeenCalled();
});

it('disconnects the reveal observer', () => {
  const root = document.createElement('div');
  const section = document.createElement('section');
  section.innerHTML = '<h2 data-reveal-title>标题</h2><div data-reveal-item>内容</div>';
  root.append(section);
  installSectionReveals(root, false)();
  expect(disconnect).toHaveBeenCalledOnce();
});

it('runs the masked title reveal before the item stagger and media wipe', () => {
  const { root, section } = createRevealSection();
  installSectionReveals(root, false);

  intersect(section);

  const title = section.querySelector('[data-reveal-title]');
  const items = section.querySelectorAll('[data-reveal-item]');
  const mediaWipes = section.querySelectorAll('[data-media-wipe]');
  const gsapCard = section.querySelector('[data-gsap-project-card]');
  const gsapParallax = section.querySelector('[data-gsap-parallax]');
  expect(mocks.animate).toHaveBeenNthCalledWith(
    1,
    title,
    expect.objectContaining({
      x: ['22vw', 0],
      scaleX: [0.7, 1],
      opacity: [0, 1],
      duration: 1200,
      ease: 'outExpo',
    }),
  );
  expect(mocks.animate).toHaveBeenNthCalledWith(
    2,
    items,
    expect.objectContaining({
      y: [54, 0],
      opacity: [0, 1],
      duration: 950,
      delay: 120,
      ease: 'outQuart',
    }),
  );
  expect(mocks.animate).toHaveBeenNthCalledWith(
    3,
    mediaWipes,
    expect.objectContaining({
      scaleX: [1, 0],
      duration: 1100,
      delay: 100,
      ease: 'inOutQuart',
    }),
  );
  expect(mocks.stagger).toHaveBeenNthCalledWith(1, 120, { start: 760 });
  expect(mocks.stagger).toHaveBeenNthCalledWith(2, 100, { start: 1200 });
  const animationTargets = mocks.animate.mock.calls.map(([targets]) => targets);
  expect(animationTargets).not.toContain(gsapCard);
  expect(animationTargets).not.toContain(gsapParallax);
});

it('gives the title a visible lead before items and starts media after the item stagger', () => {
  const { root, section } = createRevealSection();
  installSectionReveals(root, false);

  intersect(section);

  const titleOptions = mocks.animate.mock.calls[0][1] as { duration: number };
  const itemStagger = mocks.stagger.mock.calls[0];
  const mediaStagger = mocks.stagger.mock.calls[1];
  const itemStart = itemStagger[1].start;
  const lastItemStart = itemStart + itemStagger[0];
  const mediaStart = mediaStagger[1].start;

  expect(itemStart).toBeGreaterThanOrEqual(titleOptions.duration * 0.6);
  expect(mediaStart).toBeGreaterThan(lastItemStart);
});

it('reveals a section only once when duplicate intersection entries arrive', () => {
  const { root, section } = createRevealSection();
  installSectionReveals(root, false);

  intersect(section);
  intersect(section);

  expect(mocks.animate).toHaveBeenCalledTimes(3);
  expect(unobserve).toHaveBeenCalledOnce();
  expect(section).toHaveAttribute('data-revealed', 'true');
});

it('reverts active Anime.js reveals during cleanup', () => {
  const { root, section } = createRevealSection();
  const dispose = installSectionReveals(root, false);
  intersect(section);

  dispose();

  expect(mocks.animationRevert).toHaveBeenCalledTimes(3);
});

it('finishes reveal cleanup when one animation revert throws', () => {
  const titleRevert = vi.fn();
  const itemRevert = vi.fn();
  const mediaRevert = vi.fn(() => {
    throw new Error('revert failed');
  });
  mocks.animate
    .mockReturnValueOnce({ revert: titleRevert })
    .mockReturnValueOnce({ revert: itemRevert })
    .mockReturnValueOnce({ revert: mediaRevert });
  const { root, section } = createRevealSection();
  root.classList.add('motion-ready');
  const dispose = installSectionReveals(root, false);
  intersect(section);

  expect(() => dispose()).not.toThrow();
  expect(mediaRevert).toHaveBeenCalledOnce();
  expect(itemRevert).toHaveBeenCalledOnce();
  expect(titleRevert).toHaveBeenCalledOnce();
  expect(section).not.toHaveAttribute('data-revealed');
  expect(root).not.toHaveClass('motion-ready');
});

it('ignores stale observer entries after cleanup', () => {
  const { root, section } = createRevealSection();
  const dispose = installSectionReveals(root, false);

  dispose();
  intersect(section);

  expect(mocks.animate).not.toHaveBeenCalled();
  expect(unobserve).not.toHaveBeenCalled();
});

it('allows a clean reveal installation after cleanup', () => {
  const { root, section } = createRevealSection();
  const dispose = installSectionReveals(root, false);
  intersect(section);
  dispose();

  installSectionReveals(root, false);
  intersect(section);

  expect(mocks.animate).toHaveBeenCalledTimes(6);
});

it('fails open when Anime.js cannot start a reveal', () => {
  const { root, section } = createRevealSection();
  root.classList.add('motion-ready');
  mocks.animate.mockImplementationOnce(() => {
    throw new Error('animation unavailable');
  });
  installSectionReveals(root, false);

  expect(() => intersect(section)).not.toThrow();
  expect(root).not.toHaveClass('motion-ready');
  expect(disconnect).toHaveBeenCalledOnce();
  expect(section).not.toHaveAttribute('data-revealed');
});

it('continues past a non-intersecting entry to reveal later entries', () => {
  const { root, section } = createRevealSection();
  const laterSection = section.cloneNode(true) as HTMLElement;
  laterSection.id = 'strengths';
  section.after(laterSection);
  installSectionReveals(root, false);

  observerCallback(
    [
      entryFor(section, false),
      entryFor(laterSection, true),
    ],
    {} as IntersectionObserver,
  );

  expect(laterSection).toHaveAttribute('data-revealed', 'true');
});
