import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, vi } from 'vitest';
import { SiteHeader } from './SiteHeader';

const originalIntersectionObserver = globalThis.IntersectionObserver;
let notifyIntersection: IntersectionObserverCallback;

function entryFor(id: string, intersectionRatio: number) {
  return {
    boundingClientRect: new DOMRect(),
    intersectionRect: new DOMRect(),
    target: document.getElementById(id)!,
    intersectionRatio,
    isIntersecting: true,
    rootBounds: null,
    time: 0,
  } as IntersectionObserverEntry;
}

beforeEach(() => {
  class TestIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      notifyIntersection = callback;
    }

    observe() { return undefined; }
    unobserve() { return undefined; }
    disconnect() { return undefined; }
  }

  vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
});

afterEach(() => {
  vi.stubGlobal('IntersectionObserver', originalIntersectionObserver);
});

function renderHeader() {
  return render(
    <>
      <SiteHeader />
      <main data-testid="page-content">
        {['home', 'experience', 'projects', 'strengths', 'contact'].map((id) => (
          <section id={id} key={id} />
        ))}
      </main>
    </>,
  );
}

describe('SiteHeader mobile navigation', () => {
  it('marks the home wordmark as the current location before section changes', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: '个人档案' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(screen.getByRole('link', { name: '经历' })).not.toHaveAttribute('aria-current');
  });

  it('connects the trigger to the modal and isolates page content while open', async () => {
    const user = userEvent.setup();
    renderHeader();
    const trigger = screen.getByRole('button', { name: '打开导航' });

    expect(trigger).toHaveAttribute('aria-controls', 'mobile-navigation');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: '移动导航' });
    expect(dialog).toHaveAttribute('id', 'mobile-navigation');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('page-content')).toHaveAttribute('inert');
    await waitFor(() => expect(screen.getByRole('button', { name: '关闭导航' })).toHaveFocus());
  });

  it('updates the current destination in desktop and mobile navigation', async () => {
    const user = userEvent.setup();
    renderHeader();

    act(() => {
      notifyIntersection([entryFor('projects', 0.5)], {} as IntersectionObserver);
    });

    const desktopNav = screen.getByRole('navigation', { name: '主要导航' });
    expect(within(desktopNav).getByRole('link', { name: '项目' })).toHaveAttribute(
      'aria-current',
      'location',
    );

    await user.click(screen.getByRole('button', { name: '打开导航' }));
    const mobileNav = screen.getByRole('navigation', { name: '移动导航链接' });
    expect(within(mobileNav).getByRole('link', { name: '项目' })).toHaveAttribute(
      'aria-current',
      'location',
    );
  });

  it('closes after mobile navigation and restores the trigger and page access', async () => {
    const user = userEvent.setup();
    renderHeader();
    const trigger = screen.getByRole('button', { name: '打开导航' });
    const pageContent = screen.getByTestId('page-content');

    await user.click(trigger);
    const mobileNav = screen.getByRole('navigation', { name: '移动导航链接' });
    await user.click(within(mobileNav).getByRole('link', { name: '项目' }));

    expect(screen.queryByRole('dialog', { name: '移动导航' })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(pageContent).not.toHaveAttribute('inert');
    expect(pageContent).not.toHaveAttribute('aria-hidden');
  });

  it('contains forward and backward focus within the modal', async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole('button', { name: '打开导航' }));

    const dialog = screen.getByRole('dialog', { name: '移动导航' });
    const close = within(dialog).getByRole('button', { name: '关闭导航' });
    const lastLink = within(dialog).getByRole('link', { name: '联系' });
    await waitFor(() => expect(close).toHaveFocus());

    await user.tab({ shift: true });
    expect(lastLink).toHaveFocus();

    await user.tab();
    expect(close).toHaveFocus();
  });

  it('restores the trigger and page access after Escape', async () => {
    const user = userEvent.setup();
    renderHeader();
    const trigger = screen.getByRole('button', { name: '打开导航' });
    const pageContent = screen.getByTestId('page-content');

    await user.click(trigger);
    expect(pageContent).toHaveAttribute('inert');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: '移动导航' })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(pageContent).not.toHaveAttribute('inert');
    expect(pageContent).not.toHaveAttribute('aria-hidden');
  });
});
