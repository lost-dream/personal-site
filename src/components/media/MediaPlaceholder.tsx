type Props = {
  label: string;
  aspect: 'video' | 'portrait' | 'wide' | 'square';
  className?: string;
};

export function MediaPlaceholder({ label, aspect, className = '' }: Props) {
  return (
    <div
      className={`media-placeholder media-placeholder-${aspect} ${className}`}
      data-media-empty="true"
      role="img"
      aria-label={`${label}，蓝色图片占位`}
    >
      <span className="media-placeholder-label">{label}</span>
      <span className="media-wipe" data-media-wipe aria-hidden="true" />
    </div>
  );
}
