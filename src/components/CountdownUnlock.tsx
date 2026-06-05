import { useEffect, useState, type ReactNode } from 'react';
import { isUnlockedAt } from '../lib/unlock';
import type { SiteContentItem } from '../types/content';

type CountdownUnlockProps = {
  /** @deprecated Prefer unlockAt/teaser/byline for letters */
  item?: SiteContentItem;
  unlockAt?: string;
  teaser?: string;
  byline?: string | null;
  children: ReactNode;
  compact?: boolean;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function getRemaining(unlockAt: string, now: number) {
  const diff = Math.max(0, new Date(unlockAt).getTime() - now);
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, totalSec };
}

export function CountdownUnlock({
  item,
  unlockAt: unlockAtProp,
  teaser: teaserProp,
  byline: bylineProp,
  children,
  compact = false,
}: CountdownUnlockProps) {
  const unlockAt = unlockAtProp ?? item?.unlockAt ?? new Date(0).toISOString();
  const teaser = teaserProp ?? item?.description;
  const byline = bylineProp ?? item?.uploadedByLabel;

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isUnlockedAt(unlockAt, now)) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [unlockAt, now]);

  if (isUnlockedAt(unlockAt, now)) {
    return <>{children}</>;
  }

  const { days, hours, minutes, seconds } = getRemaining(unlockAt, now);

  return (
    <div className={`countdown${compact ? ' countdown--compact' : ''}`}>
      <p className="countdown__label">Unlocks in</p>
      <div className="countdown__timer" aria-live="polite">
        {days > 0 && (
          <span className="countdown__unit">
            <strong>{pad(days)}</strong>
            <small>days</small>
          </span>
        )}
        <span className="countdown__unit">
          <strong>{pad(hours)}</strong>
          <small>hrs</small>
        </span>
        <span className="countdown__unit">
          <strong>{pad(minutes)}</strong>
          <small>min</small>
        </span>
        <span className="countdown__unit">
          <strong>{pad(seconds)}</strong>
          <small>sec</small>
        </span>
      </div>
      {teaser && <p className="countdown__teaser">{teaser}</p>}
      {byline && <p className="countdown__by">{byline}</p>}
    </div>
  );
}
