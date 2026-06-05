import { formatSupabaseError } from './errors';
import type { Category } from '../types/category';
import { supabase } from './supabase';

const TABLE = 'categories';

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'episode';
}

export async function fetchCategories(): Promise<Category[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, slug, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('Categories fetch:', error.message);
    return [];
  }

  return (data ?? []) as Category[];
}

export async function createCategory(name: string): Promise<Category> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const trimmed = name.trim();
  if (!trimmed) throw new Error('Episode name is required.');

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name: trimmed, slug: slugify(trimmed) })
    .select('id, name, slug, sort_order, created_at')
    .single();

  if (error) throw new Error(formatSupabaseError(error));
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(formatSupabaseError(error));
}

export { slugify };
