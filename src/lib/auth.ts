import { ADMIN_EMAILS } from '../content';
import { supabase } from './supabase';

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((allowed) => allowed === normalized);
}

export async function signInAdmin(email: string, password: string): Promise<string> {
  if (!supabase) {
    throw new Error('Sign-in is not available yet. Finish Supabase setup (see docs/SUPABASE_SETUP.md).');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;

  const userEmail = data.user?.email;
  if (!isAdminEmail(userEmail)) {
    await supabase.auth.signOut();
    throw new Error('This email is not allowed to manage the site.');
  }

  return userEmail!;
}

export async function signOutAdmin(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}
