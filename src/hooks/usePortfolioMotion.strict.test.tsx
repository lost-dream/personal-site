import { render, waitFor } from '@testing-library/react';
import { StrictMode, useRef } from 'react';
import { expect, it, vi } from 'vitest';
import { usePortfolioMotion } from './usePortfolioMotion';

const mocks = vi.hoisted(() => {
  let mediaCleanup: (() => void) | undefined;
  const animeRevert = vi.fn();
  const contextRevert = vi.fn();
  const mediaRevert = vi.fn(() => mediaCleanup?.());
  const timelineAdd = vi.fn().mockReturnThis();
  const createScope = vi.fn(() => ({
    add: (callback: () => void) => callback(),
    revert: animeRevert,
  }));
  const matchMedia = vi.fn(() => ({
    add: (_query: string, callback: () => void | (() => void)) => {
      mediaCleanup = callback() ?? undefined;
    },
    revert: mediaRevert,
  }));

  return {
    animeRevert,
    contextRevert,
    createScope,
    matchMedia,
    mediaRevert,
    timelineAdd,
  };
});

vi.mock('./useReducedMotion', () => ({ useReducedMotion: () => false }));
vi.mock('animejs', () => ({
  createScope: mocks.createScope,
  createTimeline: vi.fn(() => ({ add: mocks.timelineAdd })),
  stagger: vi.fn((value: number) => value),
}));
vi.mock('gsap', () => ({
  gsap: {
    context: vi.fn((callback: () => void) => {
      callback();
      return { revert: mocks.contextRevert };
    }),
    matchMedia: mocks.matchMedia,
    registerPlugin: vi.fn(),
    to: vi.fn(),
    utils: { toArray: vi.fn(() => []) },
  },
}));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { create: vi.fn() } }));

it('ignores the stale dynamic-import continuation during a StrictMode remount', async () => {
  function Harness() {
    const root = useRef<HTMLDivElement>(null);
    usePortfolioMotion(root);
    return <div ref={root}>Portfolio</div>;
  }

  const view = render(
    <StrictMode>
      <Harness />
    </StrictMode>,
  );
  await waitFor(() => {
    expect(mocks.createScope).toHaveBeenCalledTimes(2);
    expect(mocks.matchMedia).toHaveBeenCalledOnce();
  });
  view.unmount();

  expect(mocks.animeRevert).toHaveBeenCalledTimes(2);
  expect(mocks.mediaRevert).toHaveBeenCalledOnce();
  expect(mocks.contextRevert).toHaveBeenCalledOnce();
});
