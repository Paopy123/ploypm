import { useEffect, useState, type ReactNode } from 'react';
import { isUnlocked } from '../lib/content';
import type { SiteContentItem } from '../types/content';

type CountdownUnlockProps = {
  item: SiteContentItem;
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

export function CountdownUnlock({ item, children, compact = false }: CountdownUnlockProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isUnlocked(item, now)) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [item, now]);

  if (isUnlocked(item, now)) {
    return <>{children}</>;
  }

  const { days, hours, minutes, seconds } = getRemaining(item.unlockAt, now);

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
      {item.description && <p className="countdown__teaser">{item.description}</p>}
      {item.uploadedByLabel && <p className="countdown__by">{item.uploadedByLabel}</p>}
    </div>
  );
}
