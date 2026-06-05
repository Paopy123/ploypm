import { UNCATEGORIZED_CATEGORY } from './uncategorized';
import type { Category } from '../types/category';
import type { SubSection } from '../types/subSection';

export type SiteViewId = 'whats-new' | 'letters' | string;

export type ParsedSiteView = {
  view: SiteViewId;
  subSectionId: string | null;
};

export function parseSiteHash(
  hash: string,
  categories: Category[],
  subSections: SubSection[],
): ParsedSiteView {
  const raw = hash.replace(/^#/, '');
  if (!raw || raw === 'whats-new') return { view: 'whats-new', subSectionId: null };
  if (raw === 'letter') return { view: 'letters', subSectionId: null };

  if (raw.startsWith('episode-')) {
    const parts = raw.split('/');
    const episodeSlug = parts[0].slice('episode-'.length);
    const subSlug = parts[1] ?? null;

    if (episodeSlug === UNCATEGORIZED_CATEGORY.slug) {
      return { view: UNCATEGORIZED_CATEGORY.id, subSectionId: null };
    }

    const cat = categories.find((c) => c.slug === episodeSlug);
    if (!cat) return { view: 'whats-new', subSectionId: null };

    if (subSlug) {
      const sub = subSections.find((s) => s.category_id === cat.id && s.slug === subSlug);
      return { view: cat.id, subSectionId: sub?.id ?? null };
    }

    const firstSub = subSections.find((s) => s.category_id === cat.id);
    return { view: cat.id, subSectionId: firstSub?.id ?? null };
  }

  return { view: 'whats-new', subSectionId: null };
}

export function hashFromSiteView(
  view: SiteViewId,
  subSectionId: string | null,
  categories: Category[],
  subSections: SubSection[],
): string {
  if (view === 'whats-new') return '#whats-new';
  if (view === 'letters') return '#letter';
  if (view === UNCATEGORIZED_CATEGORY.id) return `#episode-${UNCATEGORIZED_CATEGORY.slug}`;

  const cat = categories.find((c) => c.id === view);
  if (!cat) return '#whats-new';

  if (subSectionId) {
    const sub = subSections.find((s) => s.id === subSectionId && s.category_id === cat.id);
    if (sub) return `#episode-${cat.slug}/${sub.slug}`;
  }

  const firstSub = subSections.find((s) => s.category_id === cat.id);
  if (firstSub) return `#episode-${cat.slug}/${firstSub.slug}`;

  return `#episode-${cat.slug}`;
}

/** @deprecated use parseSiteHash */
export function viewFromHash(hash: string, categories: Category[]): SiteViewId {
  return parseSiteHash(hash, categories, []).view;
}

/** @deprecated use hashFromSiteView */
export function hashFromView(view: SiteViewId, categories: Category[]): string {
  return hashFromSiteView(view, null, categories, []);
}
