import { Pause, Play } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import type { MediaAsset } from '@/content/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useReducedData } from '@/hooks/useReducedData';
import { MediaPlaceholder } from './MediaPlaceholder';
import { ResponsiveMedia } from './ResponsiveMedia';

type Props = {
  asset?: MediaAsset;
};

export function BackgroundVideo({ asset }: Props) {
  const reducedData = useReducedData();
  if (reducedData) {
    return (
      <div className="hero-media">
        <ResponsiveMedia
          asset={asset?.poster ? { src: asset.poster, alt: asset.alt } : undefined}
          label="首屏视频" aspect="video" eager
        />
        <button className="video-control" type="button" disabled aria-label="节省流量，背景视频已停用">
          <Play aria-hidden="true" />
        </button>
      </div>
    );
  }
  return <PlayableVideo key={asset?.src} asset={asset} />;
}

function PlayableVideo({ asset }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (reduced && video && !video.paused) video.pause();
  }, [reduced]);

  if (!asset || failed) {
    return (
      <div className="hero-media">
        <MediaPlaceholder label="首屏视频" aspect="video" />
        <button className="video-control" type="button" disabled aria-label="视频待补充">
          <Play aria-hidden="true" />
        </button>
      </div>
    );
  }

  const toggle = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch {
        setPaused(video.paused);
        return;
      }
    } else {
      video.pause();
    }

    setPaused(video.paused);
  };

  return (
    <div className="hero-media">
      <video
        ref={videoRef}
        src={asset.src}
        poster={asset.poster}
        aria-hidden="true"
        autoPlay={!reduced}
        muted
        loop
        playsInline
        onError={() => setFailed(true)}
        onPause={() => setPaused(true)}
        onPlay={() => setPaused(false)}
      />
      <button
        className="video-control"
        type="button"
        onClick={toggle}
        aria-label={paused ? '播放背景视频' : '暂停背景视频'}
      >
        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
      </button>
    </div>
  );
}
