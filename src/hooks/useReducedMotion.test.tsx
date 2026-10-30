import { renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useReducedMotion } from './useReducedMotion';

function createMediaQuery(matches: boolean) {
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();
  const media = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener,
    removeEventListener,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaQueryList;

  return { media, addEventListener, removeEventListener };
}

afterEach(() => vi.restoreAllMocks());

it('synchronizes a preference change that occurs before effect subscription', () => {
  const initial = createMediaQuery(false);
  const subscribed = createMediaQuery(true);
  vi.spyOn(window, 'matchMedia')
    .mockReturnValueOnce(initial.media)
    .mockReturnValue(subscribed.media);

  const { result } = renderHook(() => useReducedMotion());

  expect(result.current).toBe(true);
});

it('removes the same media-query listener during cleanup', () => {
  const query = createMediaQuery(false);
  vi.spyOn(window, 'matchMedia').mockReturnValue(query.media);

  const { unmount } = renderHook(() => useReducedMotion());
  const listener = query.addEventListener.mock.calls[0]?.[1];
  unmount();

  expect(query.addEventListener).toHaveBeenCalledWith('change', listener);
  expect(query.removeEventListener).toHaveBeenCalledWith('change', listener);
});
