import type { SiteContentItem } from '../types/content';

type MediaPlayerProps = {
  item: SiteContentItem;
  className?: string;
};

export function MediaPlayer({ item, className = '' }: MediaPlayerProps) {
  if (item.mediaSource === 'drive' && item.mediaType === 'photo') {
    return (
      <img
        className={className}
        src={item.src}
        alt={item.description || 'Photo'}
        loading="lazy"
      />
    );
  }

  if (item.mediaSource === 'drive' && item.mediaType === 'video') {
    return (
      <div className={`drive-video ${className}`.trim()}>
        <iframe
          src={item.src}
          title={item.description || 'Video'}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <video
      className={className}
      controls
      playsInline
      preload="metadata"
      poster={item.poster}
      src={item.src}
    >
      Your browser does not support the video tag.
    </video>
  );
}
