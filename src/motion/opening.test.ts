import { beforeEach, expect, it, vi } from 'vitest';
import { installOpeningMotion } from './opening';

const mocks = vi.hoisted(() => {
  let scopeActive = false;
  const revert = vi.fn(() => {
    if (scopeActive) throw new Error('scope reverted before callback returned');
  });
  const timelineAdd = vi.fn().mockReturnThis();
  const add = vi.fn((callback: () => void) => {
    scopeActive = true;
    callback();
    scopeActive = false;
    return { revert };
  });
  const createScope = vi.fn(() => ({ add, revert }));
  const createTimeline = vi.fn(() => ({ add: timelineAdd }));
  const resetScope = () => {
    scopeActive = false;
  };
  return { revert, timelineAdd, add, createScope, createTimeline, resetScope };
});

vi.mock('animejs', () => ({
  createScope: mocks.createScope,
  createTimeline: mocks.createTimeline,
  stagger: vi.fn((value: number) => value),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resetScope();
});

it('skips setup for reduced motion', () => {
  const dispose = installOpeningMotion(document.createElement('div'), true);
  dispose();
  expect(mocks.createScope).not.toHaveBeenCalled();
});

it('reverts the Anime scope during cleanup', () => {
  const dispose = installOpeningMotion(document.createElement('div'), false);
  dispose();
  expect(mocks.revert).toHaveBeenCalledOnce();
});

it('keeps the curtain, compressed title, and staggered supporting choreography', () => {
  installOpeningMotion(document.createElement('div'), false);

  expect(mocks.createTimeline).toHaveBeenCalledWith({ defaults: { ease: 'outExpo' } });
  expect(mocks.timelineAdd).toHaveBeenNthCalledWith(
    1,
    '[data-opening-curtain]',
    expect.objectContaining({ scaleX: [1, 0] }),
  );
  expect(mocks.timelineAdd).toHaveBeenNthCalledWith(
    2,
    '[data-opening-title]',
    expect.objectContaining({
      x: ['20vw', 0],
      y: ['110%', 0],
      scaleX: [0.68, 1],
      delay: 120,
    }),
    260,
  );
  expect(mocks.timelineAdd).toHaveBeenNthCalledWith(
    3,
    '[data-opening-copy]',
    expect.objectContaining({ delay: 100 }),
    880,
  );
  expect(mocks.timelineAdd).toHaveBeenNthCalledWith(
    4,
    '[data-opening-nav]',
    expect.objectContaining({ y: [-18, 0] }),
    980,
  );
});

it('reverts setup only after the Anime scope callback has returned', () => {
  mocks.timelineAdd.mockImplementationOnce(() => {
    throw new Error('timeline unavailable');
  });

  expect(() => installOpeningMotion(document.createElement('div'), false)).toThrow(
    'timeline unavailable',
  );
  expect(mocks.revert).toHaveBeenCalledOnce();
});
