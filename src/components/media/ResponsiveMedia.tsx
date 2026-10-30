import { useState } from 'react';
import type { MediaAsset } from '@/content/types';

type Props = {
  asset?: MediaAsset;
  label: string;
  aspect: 'video' | 'portrait' | 'wide' | 'square';
  className?: string;
  eager?: boolean;
};

export function ResponsiveMedia(props: Props) {
  return <MediaContent key={props.asset?.src} {...props} />;
}

function MediaContent({ asset, label, aspect, className = '', eager = false }: Props) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(asset?.src.trim()) && !failed;

  // Keep this wrapper and wipe mounted when loading fails: Anime owns their reveal state.
  return (
    <div
      className={`media-placeholder media-placeholder-${aspect} ${className}`}
      data-media-empty={hasImage ? undefined : 'true'}
      role={hasImage ? undefined : 'img'}
      aria-label={hasImage ? undefined : `${label}，蓝色图片占位`}
    >
      {hasImage ? (
        <img
          src={asset!.src}
          alt={asset!.alt.trim() || label}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : <span className="media-placeholder-label">{label}</span>}
      <span className="media-wipe" data-media-wipe aria-hidden="true" />
    </div>
  );
}
