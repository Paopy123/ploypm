import type { Category } from '../types/category';
import type { SiteContentItem } from '../types/content';

/** Posts uploaded before episodes existed — shown in “Our memories” */
export const UNCATEGORIZED_CATEGORY: Category = {
  id: '__uncategorized__',
  name: 'Our memories',
  slug: 'memories',
  sort_order: -1,
  created_at: '',
};

export function uncategorizedPosts(posts: SiteContentItem[]): SiteContentItem[] {
  return posts.filter((p) => !p.categoryId);
}
