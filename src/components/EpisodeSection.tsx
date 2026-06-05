import { useCallback, useEffect, useState } from 'react';
import type { Category } from '../types/category';
import type { SiteContentItem } from '../types/content';
import { isUnlocked } from '../lib/content';
import { CountdownUnlock } from './CountdownUnlock';
import { HeartIcon } from './HeartIcon';
import { MediaMeta } from './MediaMeta';
import { MediaPlayer } from './MediaPlayer';

type EpisodeSectionProps = {
  category: Category;
  items: SiteContentItem[];
};

export function EpisodeSection({ category, items }: EpisodeSectionProps) {
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<SiteContentItem | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    setVisible(Object.fromEntries(items.map((item) => [item.id, true])));
  }, [items]);

  useEffect(() => {
    const hasLocked = items.some((i) => !isUnlocked(i));
    if (!hasLocked) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [items]);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, closeLightbox]);

  if (items.length === 0) return null;

  const photos = items.filter((i) => i.mediaType === 'photo' && visible[i.id] !== false);
  const videos = items.filter((i) => i.mediaType === 'video');

  return (
    <section
      id={`episode-${category.slug}`}
      className="section section--wide episode-section"
      aria-labelledby={`episode-heading-${category.slug}`}
    >
      <h2 id={`episode-heading-${category.slug}`} className="section-heading episode-section__heading">
        {category.name}
      </h2>

      {videos.length > 0 && (
        <ul className="episode-section__videos">
          {videos.map((item) => (
            <li key={item.id} className="episode-section__video-item">
              <CountdownUnlock item={item}>
                <div className="video-wrap">
                  <MediaPlayer item={item} />
                </div>
                <MediaMeta description={item.description} uploadedByLabel={item.uploadedByLabel} />
              </CountdownUnlock>
            </li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <div className="gallery episode-section__gallery">
          {items.map((item, index) =>
            item.mediaType === 'photo' && visible[item.id] !== false ? (
              <div key={item.id} className="gallery__cell">
                <CountdownUnlock item={item} compact>
                  <button
                    type="button"
                    className={`gallery__item${index === 0 ? ' gallery__item--tall' : ''}`}
                    onClick={() => isUnlocked(item) && setLightbox(item)}
                    disabled={!isUnlocked(item)}
                    aria-label={`View: ${item.description || 'Memory'}`}
                  >
                    <img
                      src={item.src}
                      alt={item.description || 'Memory'}
                      loading="lazy"
                      onError={() => setVisible((prev) => ({ ...prev, [item.id]: false }))}
                    />
                    <span className="gallery__overlay">
                      <HeartIcon pulse size={28} />
                      {item.description ? <span className="gallery__caption">{item.description}</span> : null}
                    </span>
                  </button>
                  {item.uploadedByLabel && <p className="gallery__uploader">{item.uploadedByLabel}</p>}
                </CountdownUnlock>
              </div>
            ) : null,
          )}
        </div>
      )}

      {lightbox && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.description || 'Memory'}
          onClick={closeLightbox}
        >
          <button type="button" className="lightbox__close" onClick={closeLightbox} aria-label="Close">
            ×
          </button>
          <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
            <img className="lightbox__img" src={lightbox.src} alt={lightbox.description || 'Memory'} />
            <MediaMeta description={lightbox.description} uploadedByLabel={lightbox.uploadedByLabel} />
          </figure>
        </div>
      )}
    </section>
  );
}
