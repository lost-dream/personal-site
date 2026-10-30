import { fireEvent } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { installInteractionFeedback } from './interactionFeedback';

const mocks = vi.hoisted(() => {
  const cancel = vi.fn();
  const revert = vi.fn();
  const scopeRevert = vi.fn();
  const animate = vi.fn(() => ({ cancel, revert }));
  const createScope = vi.fn(() => ({
    add: (callback: () => void) => callback(),
    revert: scopeRevert,
  }));
  return { animate, cancel, createScope, revert, scopeRevert };
});

vi.mock('animejs', () => ({ animate: mocks.animate, createScope: mocks.createScope }));

beforeEach(() => vi.clearAllMocks());

it('lets Anime.js own delegated navigation and button displacement feedback', () => {
  const root = document.createElement('div');
  root.innerHTML =
    '<nav class="desktop-nav"><a href="#projects">Projects</a></nav><button class="menu-button">Menu</button>';
  const link = root.querySelector('a')!;
  const button = root.querySelector('button')!;
  const dispose = installInteractionFeedback(root, false);

  fireEvent.pointerOver(link);
  expect(mocks.animate).toHaveBeenLastCalledWith(
    link,
    expect.objectContaining({ y: -2, scale: 1.01 }),
  );

  fireEvent.pointerDown(link);
  expect(mocks.cancel).toHaveBeenCalledOnce();

  fireEvent.pointerDown(button);
  expect(mocks.animate).toHaveBeenLastCalledWith(
    button,
    expect.objectContaining({ y: 1, scale: 0.98 }),
  );

  dispose();
  expect(mocks.scopeRevert).toHaveBeenCalledOnce();
  const callCount = mocks.animate.mock.calls.length;
  fireEvent.pointerOver(link);
  expect(mocks.animate).toHaveBeenCalledTimes(callCount);
});

it('skips displacement entirely under reduced motion', () => {
  const root = document.createElement('div');
  root.innerHTML = '<button class="menu-button">Menu</button>';
  const button = root.querySelector('button')!;
  const dispose = installInteractionFeedback(root, true);

  fireEvent.pointerOver(button);
  fireEvent.pointerDown(button);
  expect(mocks.animate).not.toHaveBeenCalled();
  expect(button).toBeEnabled();
  dispose();
});
