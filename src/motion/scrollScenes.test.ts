import { beforeEach, expect, it, vi } from 'vitest';
import { installScrollScenes } from './scrollScenes';

const mocks = vi.hoisted(() => {
  let mediaCallback: (() => void | (() => void)) | undefined;
  const revert = vi.fn();
  const context = vi.fn((callback: () => void) => {
    callback();
    return { revert };
  });
  let mediaCleanup: (() => void) | undefined;
  const mediaRevert = vi.fn(() => mediaCleanup?.());
  const mediaAdd = vi.fn((_query: string, callback: () => void | (() => void)) => {
    mediaCallback = callback;
    mediaCleanup = callback() ?? undefined;
  });
  const matchMedia = vi.fn(() => ({ add: mediaAdd, revert: mediaRevert }));
  const leaveDesktop = () => {
    mediaCleanup?.();
    mediaCleanup = undefined;
  };
  const enterDesktop = () => {
    mediaCleanup = mediaCallback?.() ?? undefined;
  };
  const resetMedia = () => {
    mediaCallback = undefined;
    mediaCleanup = undefined;
  };

  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    context,
    create: vi.fn(),
    enterDesktop,
    leaveDesktop,
    matchMedia,
    mediaAdd,
    mediaRevert,
    registerPlugin: vi.fn(),
    resetMedia,
    revert,
    to: vi.fn(),
    toArray: vi.fn((_selector: string): HTMLElement[] => []),
  };
});

vi.mock('gsap', () => ({
  gsap: {
    context: mocks.context,
    matchMedia: mocks.matchMedia,
    registerPlugin: mocks.registerPlugin,
    to: mocks.to,
    utils: { toArray: mocks.toArray },
  },
}));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {
  create: mocks.create,
  addEventListener: mocks.addEventListener,
  removeEventListener: mocks.removeEventListener,
} }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.revert.mockReset();
  mocks.create.mockReset();
  mocks.resetMedia();
  mocks.toArray.mockReturnValue([]);
});

it('remeasures natural card sizing after reverting pins when desktop width narrows', () => {
  const cards = [document.createElement('article'), document.createElement('article'), document.createElement('article')];
  let viewportWidth = 1440;
  let pinFreezesSize = false;
  Object.defineProperty(cards[0], 'offsetHeight', {
    get: () => pinFreezesSize || viewportWidth >= 1200 ? 600 : 1200,
  });
  Object.defineProperty(cards[1], 'offsetHeight', { get: () => 600 });
  mocks.toArray.mockImplementation(selector => selector === '[data-gsap-project-card]' ? cards : []);
  mocks.create.mockImplementation(({ trigger }) => {
    if (trigger === cards[0]) pinFreezesSize = true;
  });
  mocks.revert.mockImplementation(() => { pinFreezesSize = false; });
  const dispose = installScrollScenes(document.createElement('div'), false);
  expect(mocks.create.mock.calls.map(([options]) => options.trigger)).toEqual([cards[0], cards[1]]);
  const refresh = mocks.addEventListener.mock.calls.find(([event]) => event === 'refreshInit')![1];

  viewportWidth = 1050;
  expect(cards[0].offsetHeight).toBe(600); // The old pin conceals the now-tall natural layout.
  refresh();
  expect(cards[0].offsetHeight).toBe(1200);
  expect(mocks.create.mock.calls.slice(2).map(([options]) => options.trigger)).toEqual([cards[1]]);

  viewportWidth = 1440;
  refresh();
  expect(mocks.create.mock.calls.slice(3).map(([options]) => options.trigger)).toEqual([cards[0], cards[1]]);
  dispose();
});

it('does not recursively rebuild or multiply listeners across repeated refreshes', () => {
  const cards = [document.createElement('article'), document.createElement('article')];
  mocks.toArray.mockImplementation(selector => selector === '[data-gsap-project-card]' ? cards : []);
  const dispose = installScrollScenes(document.createElement('div'), false);
  const refresh = mocks.addEventListener.mock.calls.find(([event]) => event === 'refreshInit')![1];
  // Exercise a synchronous reentrant notification during scene construction.
  mocks.create.mockImplementation(() => refresh());
  refresh();
  refresh();
  expect(mocks.context).toHaveBeenCalledTimes(3);
  expect(mocks.create).toHaveBeenCalledTimes(3);
  expect(mocks.addEventListener).toHaveBeenCalledOnce();
  dispose();
  expect(mocks.removeEventListener).toHaveBeenCalledWith('refreshInit', refresh);
  expect(mocks.revert).toHaveBeenCalledTimes(3);
});

it('reverts a failed refresh rebuild and removes its refresh listener', () => {
  const cards = [document.createElement('article'), document.createElement('article')];
  mocks.toArray.mockImplementation(selector => selector === '[data-gsap-project-card]' ? cards : []);
  const dispose = installScrollScenes(document.createElement('div'), false);
  const refresh = mocks.addEventListener.mock.calls.find(([event]) => event === 'refreshInit')![1];
  mocks.to.mockImplementationOnce(() => { throw new Error('refresh animation unavailable'); });
  expect(() => refresh()).not.toThrow();
  expect(mocks.revert).toHaveBeenCalledTimes(2);
  expect(mocks.removeEventListener).toHaveBeenCalledWith('refreshInit', refresh);
  dispose();
});

it('pins fitting cards only and re-evaluates changed heights on refresh', () => {
  const root = document.createElement('div');
  const cards = [document.createElement('article'), document.createElement('article'), document.createElement('article')];
  let firstHeight = 1200;
  Object.defineProperty(cards[0], 'offsetHeight', { get: () => firstHeight });
  Object.defineProperty(cards[1], 'offsetHeight', { get: () => 600 });
  mocks.toArray.mockImplementation((selector) => selector === '[data-gsap-project-card]' ? cards : []);
  const dispose = installScrollScenes(root, false);
  expect(mocks.create.mock.calls.map(([options]) => options.trigger)).toEqual([cards[1]]);
  expect(mocks.to.mock.calls.map(([target]) => target)).toEqual([cards[1]]);
  const refresh = mocks.addEventListener.mock.calls.find(([event]) => event === 'refreshInit')![1];
  firstHeight = 600;
  refresh();
  expect(mocks.revert).toHaveBeenCalledOnce();
  expect(mocks.create.mock.calls.slice(1).map(([options]) => options.trigger)).toEqual([cards[0], cards[1]]);
  firstHeight = 1200;
  refresh();
  expect(mocks.create.mock.calls.slice(3).map(([options]) => options.trigger)).toEqual([cards[1]]);
  dispose();
  expect(mocks.removeEventListener).toHaveBeenCalledWith('refreshInit', refresh);
});

it('does not create a GSAP context in reduced motion', () => {
  installScrollScenes(document.createElement('div'), true)();

  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.matchMedia).not.toHaveBeenCalled();
});

it('lets the media query own desktop setup and teardown across breakpoint changes', () => {
  const dispose = installScrollScenes(document.createElement('div'), false);

  expect(mocks.mediaAdd).toHaveBeenCalledWith('(min-width: 1024px)', expect.any(Function));
  expect(mocks.context).toHaveBeenCalledOnce();

  mocks.leaveDesktop();
  expect(mocks.revert).toHaveBeenCalledOnce();

  mocks.enterDesktop();
  expect(mocks.context).toHaveBeenCalledTimes(2);

  dispose();
  expect(mocks.mediaRevert).toHaveBeenCalledOnce();
  expect(mocks.revert).toHaveBeenCalledTimes(2);
});

it('does not create a GSAP context while the desktop media query is inactive', () => {
  mocks.mediaAdd.mockImplementationOnce(() => undefined);

  installScrollScenes(document.createElement('div'), false)();

  expect(mocks.context).not.toHaveBeenCalled();
});

it('fails open when GSAP setup is unavailable', () => {
  mocks.context.mockImplementationOnce(() => {
    throw new Error('GSAP unavailable');
  });

  expect(() => installScrollScenes(document.createElement('div'), false)).not.toThrow();
});

it('rolls back an existing context after partial scene registration fails', () => {
  const cards = [document.createElement('article'), document.createElement('article')];
  mocks.toArray.mockReturnValue(cards);
  mocks.to.mockImplementationOnce(() => {
    throw new Error('animation unavailable');
  });

  installScrollScenes(document.createElement('div'), false);

  expect(mocks.create).toHaveBeenCalledOnce();
  expect(mocks.revert).toHaveBeenCalledOnce();
});

it('animates only dedicated GSAP wrapper selectors', () => {
  const cards = [document.createElement('article'), document.createElement('article')];
  const parallax = document.createElement('div');
  mocks.toArray.mockImplementation((selector) => {
    if (selector === '[data-gsap-project-card]') return cards;
    if (selector === '[data-gsap-parallax]') return [parallax];
    return [];
  });

  installScrollScenes(document.createElement('div'), false);

  expect(mocks.toArray.mock.calls).toEqual([
    ['[data-gsap-project-card]'],
    ['[data-gsap-parallax]'],
  ]);
  expect(mocks.create).toHaveBeenCalledTimes(1);
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ trigger: cards[0] }));
  expect(mocks.to).toHaveBeenCalledTimes(2);
  expect(mocks.to.mock.calls.map(([target]) => target)).toEqual([cards[0], parallax]);
  expect(mocks.to).toHaveBeenNthCalledWith(1, cards[0], expect.objectContaining({ scale: 0.93 }));
  expect(mocks.to).toHaveBeenNthCalledWith(
    2,
    parallax,
    expect.objectContaining({ yPercent: 8 }),
  );
});
