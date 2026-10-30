import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';
import { BackgroundVideo } from './BackgroundVideo';

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'connection');
});

describe('BackgroundVideo', () => {
  it('never creates a video in data saver and responds to live connection changes', () => {
    const connection = Object.assign(new EventTarget(), { saveData: true });
    Object.defineProperty(navigator, 'connection', { configurable: true, value: connection });
    const { container, unmount } = render(
      <BackgroundVideo asset={{ src: '/media/hero.webm', alt: '背景视频', poster: '/poster.jpg' }} />,
    );
    expect(container.querySelector('video, source')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '背景视频' })).toHaveAttribute('src', '/poster.jpg');
    act(() => { connection.saveData = false; connection.dispatchEvent(new Event('change')); });
    expect(container.querySelector('video')).toHaveAttribute('src', '/media/hero.webm');
    act(() => { connection.saveData = true; connection.dispatchEvent(new Event('change')); });
    expect(container.querySelector('video, source')).not.toBeInTheDocument();
    unmount();
    Reflect.deleteProperty(navigator, 'connection');
  });

  it('honors reduced-data media preference with a blue fallback when no poster exists', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query === '(prefers-reduced-data: reduce)', media: query, onchange: null,
      addEventListener: () => undefined, removeEventListener: () => undefined,
      addListener: () => undefined, removeListener: () => undefined, dispatchEvent: () => true,
    }));
    const { container } = render(<BackgroundVideo asset={{ src: '/media/hero.webm', alt: '背景视频' }} />);
    expect(container.querySelector('video, source')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /首屏视频.*蓝色图片占位/ })).toBeInTheDocument();
  });

  it('updates on live reduced-data media changes and removes both subscriptions on unmount', () => {
    const connection = Object.assign(new EventTarget(), { saveData: false });
    Object.defineProperty(navigator, 'connection', { configurable: true, value: connection });
    const media = Object.assign(new EventTarget(), { matches: false, media: '(prefers-reduced-data: reduce)' });
    const originalMatchMedia = window.matchMedia;
    vi.spyOn(window, 'matchMedia').mockImplementation(query => query === media.media ? media as unknown as MediaQueryList : originalMatchMedia(query));
    const removeConnection = vi.spyOn(connection, 'removeEventListener');
    const removeMedia = vi.spyOn(media, 'removeEventListener');
    const { container, unmount } = render(<BackgroundVideo asset={{ src: '/hero.webm', alt: '背景视频' }} />);
    expect(container.querySelector('video')).toBeInTheDocument();
    act(() => { media.matches = true; media.dispatchEvent(new Event('change')); });
    expect(container.querySelector('video')).not.toBeInTheDocument();
    act(() => { media.matches = false; media.dispatchEvent(new Event('change')); });
    expect(container.querySelector('video')).toBeInTheDocument();
    unmount();
    expect(removeConnection).toHaveBeenCalledWith('change', expect.any(Function));
    expect(removeMedia).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('renders a blue placeholder and disabled control without media', () => {
    render(<BackgroundVideo />);

    expect(screen.getByRole('img', { name: /首屏视频.*蓝色图片占位/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '视频待补充' })).toBeDisabled();
  });

  it('falls back when configured video media fails', () => {
    const { container } = render(
      <BackgroundVideo asset={{ src: '/media/hero.webm', alt: '背景视频' }} />,
    );

    fireEvent.error(container.querySelector('video')!);

    expect(screen.getByRole('img', { name: /首屏视频.*蓝色图片占位/ })).toBeInTheDocument();
  });

  it('tracks confirmed playback instead of assuming autoplay succeeds', () => {
    const { container } = render(
      <BackgroundVideo asset={{ src: '/media/hero.webm', alt: '背景视频' }} />,
    );
    const video = container.querySelector('video')!;

    expect(screen.getByRole('button', { name: '播放背景视频' })).toBeInTheDocument();

    fireEvent.play(video);
    expect(screen.getByRole('button', { name: '暂停背景视频' })).toBeInTheDocument();

    fireEvent.pause(video);
    expect(screen.getByRole('button', { name: '播放背景视频' })).toBeInTheDocument();
  });

  it('does not autoplay decorative motion when reduced motion is requested', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }));

    const { container } = render(
      <BackgroundVideo asset={{ src: '/media/hero.webm', alt: '背景视频' }} />,
    );

    expect(container.querySelector('video')).not.toHaveAttribute('autoplay');
  });

  it('pauses a running video when the OS switches to reduced motion', () => {
    let reduced = false;
    let onPreferenceChange: (() => void) | undefined;
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      get matches() {
        return query === '(prefers-reduced-motion: reduce)' && reduced;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        if (query !== '(prefers-reduced-motion: reduce)') return;
        onPreferenceChange = () => {
          if (typeof listener === 'function') listener(new Event('change'));
        };
      },
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }));

    const { container } = render(
      <BackgroundVideo asset={{ src: '/media/hero.webm', alt: '背景视频' }} />,
    );
    const video = container.querySelector('video')!;
    const pause = vi.fn();
    Object.defineProperty(video, 'paused', { configurable: true, get: () => false });
    Object.defineProperty(video, 'pause', { configurable: true, value: pause });
    fireEvent.play(video);

    act(() => {
      reduced = true;
      onPreferenceChange?.();
    });

    expect(pause).toHaveBeenCalledOnce();
  });

  it('uses the media API to toggle confirmed playback', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BackgroundVideo asset={{ src: '/media/hero.webm', alt: '背景视频' }} />,
    );
    const video = container.querySelector('video')!;
    let paused = true;

    Object.defineProperty(video, 'paused', { configurable: true, get: () => paused });
    Object.defineProperty(video, 'play', {
      configurable: true,
      value: async () => {
        paused = false;
        fireEvent.play(video);
      },
    });
    Object.defineProperty(video, 'pause', {
      configurable: true,
      value: () => {
        paused = true;
        fireEvent.pause(video);
      },
    });

    await user.click(screen.getByRole('button', { name: '播放背景视频' }));
    expect(screen.getByRole('button', { name: '暂停背景视频' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '暂停背景视频' }));
    expect(screen.getByRole('button', { name: '播放背景视频' })).toBeInTheDocument();
  });

  it.each(['AbortError', 'NotAllowedError'])(
    'keeps the media available when play rejects with %s',
    async (errorName) => {
      const user = userEvent.setup();
      const { container } = render(
        <BackgroundVideo asset={{ src: '/media/hero.webm', alt: '背景视频' }} />,
      );
      const video = container.querySelector('video')!;

      Object.defineProperty(video, 'play', {
        configurable: true,
        value: () => Promise.reject(new DOMException('Playback rejected', errorName)),
      });

      await user.click(screen.getByRole('button', { name: '播放背景视频' }));

      await waitFor(() => expect(container.querySelector('video')).toBeInTheDocument());
      expect(screen.getByRole('button', { name: '播放背景视频' })).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: /首屏视频.*蓝色图片占位/ })).not.toBeInTheDocument();
    },
  );
});
