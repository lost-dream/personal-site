import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { expect, it, vi } from 'vitest';

vi.mock('@/motion/opening', () => {
  throw new Error('motion module unavailable');
});

it('keeps static content visible when the motion module fails to load', async () => {
  const hookModule = import('./usePortfolioMotion');
  await expect(hookModule).resolves.toBeDefined();
  const { usePortfolioMotion } = await hookModule;

  function Harness() {
    const root = useRef<HTMLDivElement>(null);
    usePortfolioMotion(root);
    return (
      <div ref={root} data-testid="page-root">
        Static portfolio content
      </div>
    );
  }

  render(<Harness />);
  const root = screen.getByTestId('page-root');
  expect(root).toBeVisible();
  expect(root).not.toHaveClass('motion-ready');

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  expect(root).toBeVisible();
  expect(root).not.toHaveClass('motion-ready');
});
