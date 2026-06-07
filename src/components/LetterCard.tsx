import { useState } from 'react';
import { notifyLetterOpened } from '../lib/letterNotify';
import { isUnlockedAt } from '../lib/unlock';
import type { Letter } from '../types/letter';
import { CountdownUnlock } from './CountdownUnlock';
import { HeartIcon } from './HeartIcon';

type LetterCardProps = {
  letter: Letter;
  featured?: boolean;
};

export function LetterCard({ letter, featured = false }: LetterCardProps) {
  const [open, setOpen] = useState(false);
  const unlocked = isUnlockedAt(letter.unlock_at);

  return (
    <CountdownUnlock
      unlockAt={letter.unlock_at}
      teaser={letter.title}
      byline={letter.uploaded_by_label}
    >
      <article className={`letter-card${featured ? ' letter-card--featured' : ''}`}>
        <header className="letter-card__header">
          <HeartIcon pulse size={featured ? 22 : 18} />
          <h3 className="letter-card__title">{letter.title}</h3>
          {featured && <span className="letter-card__badge">New</span>}
        </header>

        {!open ? (
          <button
            type="button"
            className="letter-btn letter-card__open"
            onClick={() => {
              setOpen(true);
              if (unlocked) {
                void notifyLetterOpened({ letterId: letter.id, letterTitle: letter.title });
              }
            }}
          >
            <span className="letter-btn__inner">
              <HeartIcon size={16} />
              Open the letter
            </span>
          </button>
        ) : (
          <div className="letter-content letter-card__body">{letter.body}</div>
        )}

        <footer className="letter-card__footer">
          {letter.uploaded_by_label && <span>{letter.uploaded_by_label}</span>}
          {unlocked && (
            <time dateTime={letter.created_at}>
              {new Date(letter.created_at).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          )}
        </footer>
      </article>
    </CountdownUnlock>
  );
}
