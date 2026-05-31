import { useEffect, useState } from 'react';
import { VIDEO_PATH, VIDEO_POSTER } from '../content';
import { fetchVideoItems, isUnlocked } from '../lib/content';
import type { SiteContentItem } from '../types/content';
import { CountdownUnlock } from './CountdownUnlock';
import { MediaMeta } from './MediaMeta';
import { MediaPlayer } from './MediaPlayer';

function staticFallback(): SiteContentItem {
  return {
    id: 'static-video',
    mediaType: 'video',
    mediaSource: 'supabase',
    src: VIDEO_PATH,
    poster: VIDEO_POSTER,
    description: '',
    uploadedByEmail: null,
    uploadedByLabel: null,
    unlockAt: new Date(0).toISOString(),
    createdAt: new Date(0).toISOString(),
    isStatic: true,
    isNew: false,
  };
}

export function VideoSection() {
  const [videos, setVideos] = useState<SiteContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [, tick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchVideoItems().then((items) => {
      if (cancelled) return;
      setVideos(items.length > 0 ? items : [staticFallback()]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const hasLocked = videos.some((v) => !isUnlocked(v));
    if (!hasLocked) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [videos]);

  if (loading) {
    return (
      <section className="section section--wide">
        <p className="gallery-loading">Loading videos…</p>
      </section>
    );
  }

  return (
    <section className="section section--wide video-section" aria-labelledby="video-heading">
      <h2 id="video-heading" className="section-heading">
        Our moments
      </h2>
      <ul className="video-section__list">
        {videos.map((item) => (
          <li key={item.id} className="video-section__item">
            <CountdownUnlock item={item}>
              <div className="video-wrap">
                <MediaPlayer item={item} />
              </div>
              <MediaMeta description={item.description} uploadedByLabel={item.uploadedByLabel} />
            </CountdownUnlock>
          </li>
        ))}
      </ul>
    </section>
  );
}
