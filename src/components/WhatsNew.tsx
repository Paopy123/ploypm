import { useEffect, useState } from 'react';
import { isUnlocked } from '../lib/content';
import type { SiteContentItem } from '../types/content';
import { CountdownUnlock } from './CountdownUnlock';
import { HeartIcon } from './HeartIcon';
import { MediaMeta } from './MediaMeta';
import { MediaPlayer } from './MediaPlayer';

type WhatsNewProps = {
  items: SiteContentItem[];
  loading?: boolean;
};

export function WhatsNew({ items, loading = false }: WhatsNewProps) {
  const [, tick] = useState(0);

  useEffect(() => {
    const hasLocked = items.some((i) => !isUnlocked(i));
    if (!hasLocked) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [items]);

  if (!loading && items.length === 0) return null;

  return (
    <section id="whats-new" className="section section--wide whats-new" aria-labelledby="whats-new-heading">
      <h2 id="whats-new-heading" className="whats-new__heading">
        <HeartIcon pulse size={22} /> What&apos;s new
      </h2>
      <p className="whats-new__lead">The newest memories appear here first.</p>

      {loading ? (
        <p className="gallery-loading">Loading what&apos;s new…</p>
      ) : (
        <ul className="whats-new__list">
          {items.map((item) => (
            <li key={item.id} className="whats-new__item">
              <CountdownUnlock item={item}>
                <article className="whats-new__card">
                  {item.mediaType === 'video' ? (
                    <div className="whats-new__video-wrap">
                      <MediaPlayer item={item} className="whats-new__video" />
                    </div>
                  ) : (
                    <img
                      src={item.src}
                      alt={item.description || 'New memory'}
                      className="whats-new__img"
                      loading="lazy"
                    />
                  )}
                  <MediaMeta
                    description={item.description}
                    uploadedByLabel={item.uploadedByLabel}
                    badge="New"
                  />
                  {item.categoryName && (
                    <p className="whats-new__category">Also in: {item.categoryName}</p>
                  )}
                </article>
              </CountdownUnlock>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
