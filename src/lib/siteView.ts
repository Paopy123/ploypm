import { UNCATEGORIZED_CATEGORY } from './uncategorized';
import type { Category } from '../types/category';

export type SiteViewId = 'whats-new' | 'letters' | string;

export function viewFromHash(hash: string, categories: Category[]): SiteViewId {
  const h = hash.replace(/^#/, '');
  if (!h || h === 'whats-new') return 'whats-new';
  if (h === 'letter') return 'letters';

  if (h.startsWith('episode-')) {
    const slug = h.slice('episode-'.length);
    if (slug === UNCATEGORIZED_CATEGORY.slug) return UNCATEGORIZED_CATEGORY.id;
    const cat = categories.find((c) => c.slug === slug);
    if (cat) return cat.id;
  }

  return 'whats-new';
}

export function hashFromView(view: SiteViewId, categories: Category[]): string {
  if (view === 'whats-new') return '#whats-new';
  if (view === 'letters') return '#letter';
  if (view === UNCATEGORIZED_CATEGORY.id) return `#episode-${UNCATEGORIZED_CATEGORY.slug}`;

  const cat = categories.find((c) => c.id === view);
  if (cat) return `#episode-${cat.slug}`;

  return '#whats-new';
}
