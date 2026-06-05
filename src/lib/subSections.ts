import { slugify } from './categories';
import { formatSupabaseError } from './errors';
import type { SubSection } from '../types/subSection';
import { supabase } from './supabase';

const TABLE = 'sub_sections';

export async function fetchSubSections(): Promise<SubSection[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, category_id, name, slug, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('Sub-sections fetch:', error.message);
    return [];
  }

  return (data ?? []) as SubSection[];
}

export function subSectionsForCategory(subSections: SubSection[], categoryId: string): SubSection[] {
  return subSections.filter((s) => s.category_id === categoryId);
}

export async function createSubSection(categoryId: string, name: string): Promise<SubSection> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const trimmed = name.trim();
  if (!trimmed) throw new Error('Section name is required.');

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ category_id: categoryId, name: trimmed, slug: slugify(trimmed) })
    .select('id, category_id, name, slug, sort_order, created_at')
    .single();

  if (error) throw new Error(formatSupabaseError(error));
  return data as SubSection;
}

export async function deleteSubSection(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(formatSupabaseError(error));
}
