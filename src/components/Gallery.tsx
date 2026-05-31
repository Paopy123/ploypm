import { useCallback, useEffect, useState } from 'react';
import { fetchPhotoItems, isUnlocked } from '../lib/content';
import type { SiteContentItem } from '../types/content';
import { CountdownUnlock } from './CountdownUnlock';
import { HeartIcon } from './HeartIcon';
import { MediaMeta } from './MediaMeta';

export function Gallery() {
  const [items, setItems] = useState<SiteContentItem[]>([]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<SiteContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [, tick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchPhotoItems().then((data) => {
      if (cancelled) return;
      setItems(data);
      setVisible(Object.fromEntries(data.map((item) => [item.id, true])));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const hasLocked = items.some((i) => !i.isStatic && !isUnlocked(i));
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

  const handleError = (id: string) => {
    setVisible((prev) => ({ ...prev, [id]: false }));
  };

  const shown = items.filter((item) => visible[item.id] !== false);
  if (!loading && shown.length === 0) return null;

  return (
    <section className="section section--wide" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading" className="section-heading">
        Our memories
      </h2>

      {loading ? (
        <p className="gallery-loading">Loading memories…</p>
      ) : (
        <div className="gallery">
          {items.map((item, index) =>
            visible[item.id] !== false ? (
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
                      onError={() => handleError(item.id)}
                    />
                    <span className="gallery__overlay">
                      <HeartIcon pulse size={28} />
                      {item.description ? (
                        <span className="gallery__caption">{item.description}</span>
                      ) : null}
                    </span>
                  </button>
                  {!item.isStatic && item.uploadedByLabel && (
                    <p className="gallery__uploader">{item.uploadedByLabel}</p>
                  )}
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
