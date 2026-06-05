import { useMemo, useState } from 'react';
import { createSubSection, deleteSubSection, subSectionsForCategory } from '../lib/subSections';
import { formatSupabaseError } from '../lib/errors';
import type { Category } from '../types/category';
import type { SubSection } from '../types/subSection';

type AdminSubSectionsPanelProps = {
  categories: Category[];
  subSections: SubSection[];
  busy: boolean;
  setBusy: (v: boolean) => void;
  setError: (v: string) => void;
  setMessage: (v: string) => void;
  onChanged: () => Promise<void>;
};

export function AdminSubSectionsPanel({
  categories,
  subSections,
  busy,
  setBusy,
  setError,
  setMessage,
  onChanged,
}: AdminSubSectionsPanelProps) {
  const [episodeId, setEpisodeId] = useState(categories[0]?.id ?? '');
  const [sectionName, setSectionName] = useState('');

  const episodeSections = useMemo(
    () => subSectionsForCategory(subSections, episodeId),
    [subSections, episodeId],
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!episodeId) {
      setError('Create an episode first in the Episodes tab.');
      return;
    }
    if (!sectionName.trim()) {
      setError('Enter a section name (e.g. Our memories).');
      return;
    }

    setBusy(true);
    try {
      const sub = await createSubSection(episodeId, sectionName);
      setSectionName('');
      setMessage(`Section “${sub.name}” added.`);
      await onChanged();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (sub: SubSection) => {
    if (!window.confirm(`Remove “${sub.name}”? Uploads keep their episode but lose this section.`)) return;
    setBusy(true);
    setError('');
    try {
      await deleteSubSection(sub.id);
      setMessage(`Removed section “${sub.name}”.`);
      await onChanged();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  };

  if (categories.length === 0) {
    return (
      <p className="admin-alert admin-alert--warn">
        Create an episode first in the <strong>Episodes</strong> tab, then add sub-memories here (e.g. Our memories inside
        Australia).
      </p>
    );
  }

  return (
    <section className="admin-subsections" aria-labelledby="admin-subsections-heading">
      <h2 id="admin-subsections-heading" className="admin-list__title">
        Sub-memories (sections inside episodes)
      </h2>
      <p className="admin-field__hint">
        Example: episode <strong>Australia</strong> → section <strong>Our memories</strong>. Each section gets its own menu
        inside that episode on the site.
      </p>

      <form className="admin-form admin-subsections__form" onSubmit={handleCreate}>
        <label className="admin-field">
          <span>Episode</span>
          <select value={episodeId} onChange={(e) => setEpisodeId(e.target.value)} required>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span>Section name</span>
          <input
            type="text"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="Our memories"
          />
        </label>

        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
          Add section
        </button>
      </form>

      {episodeSections.length === 0 ? (
        <p className="admin-list__empty">No sections in this episode yet.</p>
      ) : (
        <ul className="admin-subsections__list">
          {episodeSections.map((sub) => (
            <li key={sub.id} className="admin-subsections__item">
              <div>
                <strong>{sub.name}</strong>
                <span className="admin-episodes__slug">#{sub.slug}</span>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={() => void handleDelete(sub)}
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
