import { useEffect, useState } from 'react';
import { isUnlockedAt } from '../lib/unlock';
import type { Letter } from '../types/letter';
import { HeartIcon } from './HeartIcon';
import { LetterCard } from './LetterCard';

type LetterArchiveProps = {
  letters: Letter[];
  loading?: boolean;
};

export function LetterArchive({ letters, loading = false }: LetterArchiveProps) {
  const [, tick] = useState(0);

  useEffect(() => {
    const hasLocked = letters.some((l) => !isUnlockedAt(l.unlock_at));
    if (!hasLocked) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [letters]);

  if (!loading && letters.length === 0) return null;

  return (
    <section id="letter" className="section section--wide letter-archive" aria-labelledby="letter-heading">
      <h2 id="letter-heading" className="section-heading letter-archive__heading">
        <HeartIcon pulse size={24} /> Letters
      </h2>
      <p className="letter-archive__lead">Every letter I wrote for you, kept here forever.</p>

      {loading ? (
        <p className="gallery-loading">Loading letters…</p>
      ) : (
        <ul className="letter-archive__list">
          {letters.map((letter) => (
            <li key={letter.id} className="letter-archive__item">
              <LetterCard letter={letter} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
