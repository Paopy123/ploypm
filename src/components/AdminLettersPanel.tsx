import { useState } from 'react';
import { createLetter, deleteLetter } from '../lib/letters';
import { isUnlockedAt } from '../lib/unlock';
import { formatSupabaseError } from '../lib/errors';
import type { Letter } from '../types/letter';

function defaultUnlockLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

type AdminLettersPanelProps = {
  letters: Letter[];
  email: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setError: (v: string) => void;
  setMessage: (v: string) => void;
  onChanged: () => Promise<void>;
};

export function AdminLettersPanel({
  letters,
  email,
  busy,
  setBusy,
  setError,
  setMessage,
  onChanged,
}: AdminLettersPanelProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [unlockLocal, setUnlockLocal] = useState(defaultUnlockLocal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const unlockAt = new Date(unlockLocal);
    if (Number.isNaN(unlockAt.getTime())) {
      setError('Please set a valid unlock date and time.');
      return;
    }

    setBusy(true);
    try {
      await createLetter({ title, body, unlockAt, uploadedByEmail: email });
      setTitle('');
      setBody('');
      setUnlockLocal(defaultUnlockLocal());
      const when =
        unlockAt.getTime() > Date.now()
          ? `Scheduled — unlocks ${unlockAt.toLocaleString()}`
          : 'Live now — appears in What’s new (only the newest letter shows there)';
      setMessage(`Letter published! ${when}`);
      await onChanged();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (letter: Letter) => {
    if (!window.confirm(`Remove “${letter.title}”?`)) return;
    setBusy(true);
    setError('');
    try {
      await deleteLetter(letter.id);
      setMessage('Letter removed.');
      await onChanged();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-letters" aria-labelledby="admin-letters-heading">
      <h2 id="admin-letters-heading" className="admin-list__title">
        Letters
      </h2>
      <p className="admin-field__hint">
        The <strong>newest</strong> letter appears alone in What&apos;s new. When you publish another, the previous one
        moves to the <strong>Letters</strong> section on the site.
      </p>

      <form className="admin-form admin-form--post" onSubmit={handleSubmit}>
        <label className="admin-field">
          <span>Letter name</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="For our anniversary"
            required
          />
        </label>

        <label className="admin-field">
          <span>Letter text</span>
          <textarea
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="My dearest,&#10;&#10;I wanted to tell you…"
            required
          />
        </label>

        <label className="admin-field">
          <span>Unlock date & time</span>
          <input
            type="datetime-local"
            value={unlockLocal}
            onChange={(e) => setUnlockLocal(e.target.value)}
            required
          />
          <small className="admin-field__hint">Future time = countdown until she can read it.</small>
        </label>

        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
          {busy ? 'Saving…' : 'Publish letter'}
        </button>
      </form>

      <h3 className="admin-list__title admin-letters__subtitle">All letters</h3>
      {letters.length === 0 ? (
        <p className="admin-list__empty">No letters yet.</p>
      ) : (
        <ul className="admin-letters__list">
          {letters.map((letter, index) => (
            <li key={letter.id} className="admin-letters__item">
              <div className="admin-letters__item-head">
                <strong>{letter.title}</strong>
                {index === 0 && <span className="admin-letters__tag">In What&apos;s new</span>}
              </div>
              <p className="admin-letters__preview">{letter.body.slice(0, 120)}{letter.body.length > 120 ? '…' : ''}</p>
              <p className="admin-post__meta">
                {isUnlockedAt(letter.unlock_at)
                  ? `Published ${new Date(letter.created_at).toLocaleString()}`
                  : `Unlocks ${new Date(letter.unlock_at).toLocaleString()}`}
              </p>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={() => void handleDelete(letter)}
                disabled={busy}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
