import type { SubSection } from '../types/subSection';

type EpisodeSubNavProps = {
  subSections: SubSection[];
  activeSubSectionId: string | null;
  onSelect: (subSectionId: string) => void;
};

export function EpisodeSubNav({ subSections, activeSubSectionId, onSelect }: EpisodeSubNavProps) {
  if (subSections.length === 0) return null;

  return (
    <nav className="episode-subnav" aria-label="Episode sections">
      <ul className="episode-subnav__list">
        {subSections.map((sub) => (
          <li key={sub.id}>
            <button
              type="button"
              className={`episode-subnav__link${activeSubSectionId === sub.id ? ' episode-subnav__link--active' : ''}`}
              onClick={() => onSelect(sub.id)}
            >
              {sub.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
