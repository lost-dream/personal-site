import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => true,
  }),
});

class IntersectionObserverMock {
  observe() { return undefined; }
  unobserve() { return undefined; }
  disconnect() { return undefined; }
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
