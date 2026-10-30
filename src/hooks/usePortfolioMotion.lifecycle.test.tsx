import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { usePortfolioMotion } from './usePortfolioMotion';

const mocks = vi.hoisted(() => ({
  disposeOpening: vi.fn(),
  disposeInteractions: vi.fn(),
  disposeReveals: vi.fn(),
  disposeScroll: vi.fn(),
  installOpeningMotion: vi.fn(),
  installInteractionFeedback: vi.fn(),
  installSectionReveals: vi.fn(),
  installScrollScenes: vi.fn(),
}));

vi.mock('./useReducedMotion', () => ({ useReducedMotion: () => false }));
vi.mock('@/motion/opening', () => ({ installOpeningMotion: mocks.installOpeningMotion }));
vi.mock('@/motion/interactionFeedback', () => ({
  installInteractionFeedback: mocks.installInteractionFeedback,
}));
vi.mock('@/motion/sectionReveal', () => ({ installSectionReveals: mocks.installSectionReveals }));
vi.mock('@/motion/scrollScenes', () => ({ installScrollScenes: mocks.installScrollScenes }));

beforeEach(() => {
  vi.clearAllMocks();
});

it('installs and disposes every motion system from one lifecycle', async () => {
  mocks.installOpeningMotion.mockReturnValue(mocks.disposeOpening);
  mocks.installInteractionFeedback.mockReturnValue(mocks.disposeInteractions);
  mocks.installSectionReveals.mockReturnValue(mocks.disposeReveals);
  mocks.installScrollScenes.mockReturnValue(mocks.disposeScroll);

  function Harness() {
    const root = useRef<HTMLDivElement>(null);
    usePortfolioMotion(root);
    return <div ref={root}>Portfolio</div>;
  }

  const view = render(<Harness />);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  view.unmount();

  expect(mocks.installOpeningMotion).toHaveBeenCalledOnce();
  expect(mocks.installInteractionFeedback).toHaveBeenCalledOnce();
  expect(mocks.installSectionReveals).toHaveBeenCalledOnce();
  expect(mocks.installScrollScenes).toHaveBeenCalledOnce();
  expect(mocks.disposeOpening).toHaveBeenCalledOnce();
  expect(mocks.disposeInteractions).toHaveBeenCalledOnce();
  expect(mocks.disposeReveals).toHaveBeenCalledOnce();
  expect(mocks.disposeScroll).toHaveBeenCalledOnce();
});

it('continues lifecycle cleanup when one motion disposer throws', async () => {
  mocks.disposeOpening.mockImplementationOnce(() => {
    throw new Error('opening cleanup failed');
  });
  mocks.installOpeningMotion.mockReturnValue(mocks.disposeOpening);
  mocks.installInteractionFeedback.mockReturnValue(mocks.disposeInteractions);
  mocks.installSectionReveals.mockReturnValue(mocks.disposeReveals);
  mocks.installScrollScenes.mockReturnValue(mocks.disposeScroll);

  function Harness() {
    const root = useRef<HTMLDivElement>(null);
    usePortfolioMotion(root);
    return <div ref={root}>Portfolio</div>;
  }

  const view = render(<Harness />);
  const pageRoot = view.container.firstElementChild as HTMLElement;
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  expect(() => view.unmount()).not.toThrow();
  expect(pageRoot).not.toHaveClass('motion-ready');
  expect(mocks.disposeOpening).toHaveBeenCalledOnce();
  expect(mocks.disposeInteractions).toHaveBeenCalledOnce();
  expect(mocks.disposeReveals).toHaveBeenCalledOnce();
  expect(mocks.disposeScroll).toHaveBeenCalledOnce();
});
