import { useEffect, useState } from 'react';
import { isUnlocked } from '../lib/content';
import { isUnlockedAt } from '../lib/unlock';
import type { SiteContentItem } from '../types/content';
import type { Letter } from '../types/letter';
import { CountdownUnlock } from './CountdownUnlock';
import { HeartIcon } from './HeartIcon';
import { LetterCard } from './LetterCard';
import { MediaMeta } from './MediaMeta';
import { MediaPlayer } from './MediaPlayer';

type WhatsNewProps = {
  items: SiteContentItem[];
  featuredLetter?: Letter | null;
  loading?: boolean;
};

export function WhatsNew({ items, featuredLetter, loading = false }: WhatsNewProps) {
  const [, tick] = useState(0);

  const hasLockedMedia = items.some((i) => !isUnlocked(i));
  const hasLockedLetter = featuredLetter ? !isUnlockedAt(featuredLetter.unlock_at) : false;

  useEffect(() => {
    if (!hasLockedMedia && !hasLockedLetter) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [hasLockedMedia, hasLockedLetter]);

  const isEmpty = !loading && items.length === 0 && !featuredLetter;
  if (isEmpty) return null;

  return (
    <section id="whats-new" className="section section--wide whats-new" aria-labelledby="whats-new-heading">
      <h2 id="whats-new-heading" className="whats-new__heading">
        <HeartIcon pulse size={22} /> What&apos;s new
      </h2>
      <p className="whats-new__lead">The newest letter and memories appear here first.</p>

      {loading ? (
        <p className="gallery-loading">Loading what&apos;s new…</p>
      ) : (
        <ul className="whats-new__list">
          {featuredLetter && (
            <li key={featuredLetter.id} className="whats-new__item whats-new__item--letter">
              <LetterCard letter={featuredLetter} featured />
            </li>
          )}
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
