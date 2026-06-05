import { formatSupabaseError } from './errors';
import { getUploaderCredit } from './uploader';
import type { Letter } from '../types/letter';
import { supabase } from './supabase';

const TABLE = 'letters';

type LetterRow = {
  id: string;
  title: string;
  body: string;
  unlock_at: string;
  uploaded_by_email: string | null;
  created_at: string;
};

function toLetter(row: LetterRow): Letter {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    unlock_at: row.unlock_at,
    uploaded_by_email: row.uploaded_by_email,
    uploaded_by_label: getUploaderCredit(row.uploaded_by_email),
    created_at: row.created_at,
  };
}

export async function fetchLetters(): Promise<Letter[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, title, body, unlock_at, uploaded_by_email, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Letters fetch:', error.message);
    return [];
  }

  return ((data ?? []) as LetterRow[]).map(toLetter);
}

/** Newest letter — only one shown in What's New */
export function featuredLetter(letters: Letter[]): Letter | null {
  return letters[0] ?? null;
}

/** Older letters for the Letters archive section */
export function archiveLetters(letters: Letter[]): Letter[] {
  return letters.slice(1);
}

async function requireAuthSession() {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) {
    throw new Error('Your session expired. Sign out, sign in again, then publish.');
  }
  return data.session;
}

export async function createLetter(params: {
  title: string;
  body: string;
  unlockAt: Date;
  uploadedByEmail: string;
}): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  await requireAuthSession();

  const title = params.title.trim();
  const body = params.body.trim();
  if (!title) throw new Error('Letter name is required.');
  if (!body) throw new Error('Letter text is required.');

  const { error } = await supabase.from(TABLE).insert({
    title,
    body,
    unlock_at: params.unlockAt.toISOString(),
    uploaded_by_email: params.uploadedByEmail.trim().toLowerCase(),
  });

  if (error) throw new Error(formatSupabaseError(error));
}

export async function deleteLetter(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  await requireAuthSession();

  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(formatSupabaseError(error));
}
