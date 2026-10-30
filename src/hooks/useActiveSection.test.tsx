import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useActiveSection } from './useActiveSection';

const sectionIds = ['home', 'experience', 'projects', 'strengths', 'contact'];
const originalIntersectionObserver = globalThis.IntersectionObserver;
let notifyIntersection: IntersectionObserverCallback;
const disconnectObserver = vi.fn<() => void>();

function ActiveSectionHarness() {
  const activeSection = useActiveSection(sectionIds);

  return (
    <>
      <output aria-label="active section">{activeSection}</output>
      {sectionIds.map((id) => <section id={id} key={id} />)}
    </>
  );
}

function entryFor(id: string, intersectionRatio: number, isIntersecting = true) {
  return {
    boundingClientRect: new DOMRect(),
    intersectionRect: new DOMRect(),
    target: document.getElementById(id)!,
    intersectionRatio,
    isIntersecting,
    rootBounds: null,
    time: 0,
  } as IntersectionObserverEntry;
}

beforeEach(() => {
  disconnectObserver.mockClear();

  class TestIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      notifyIntersection = callback;
    }

    observe() { return undefined; }
    unobserve() { return undefined; }
    disconnect() { disconnectObserver(); }
  }

  vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
});

afterEach(() => {
  vi.stubGlobal('IntersectionObserver', originalIntersectionObserver);
});

it('starts at home and promotes the most visible stable section', () => {
  render(<ActiveSectionHarness />);
  expect(screen.getByLabelText('active section')).toHaveTextContent('home');

  act(() => {
    notifyIntersection(
      [entryFor('experience', 0.25), entryFor('projects', 0.5)],
      {} as IntersectionObserver,
    );
  });

  expect(screen.getByLabelText('active section')).toHaveTextContent('projects');
});

it('ignores entries that are outside the observer window', () => {
  render(<ActiveSectionHarness />);

  act(() => {
    notifyIntersection([entryFor('contact', 0.9, false)], {} as IntersectionObserver);
  });

  expect(screen.getByLabelText('active section')).toHaveTextContent('home');
});

it('disconnects its observer when the consumer unmounts', () => {
  const { unmount } = render(<ActiveSectionHarness />);

  unmount();

  expect(disconnectObserver).toHaveBeenCalledOnce();
});
