type SupabaseLikeError = {
  message?: string;
  details?: string;
  hint?: string;
  error?: string;
  statusCode?: number | string;
};

export function formatSupabaseError(err: unknown): string {
  if (!err) return 'Something went wrong. Please try again.';

  if (err instanceof Error && err.message) {
    return mapFriendlyMessage(err.message);
  }

  const e = err as SupabaseLikeError;
  const parts = [e.message, e.error, e.details, e.hint].filter(
    (p): p is string => typeof p === 'string' && p.length > 0,
  );

  if (parts.length > 0) {
    return mapFriendlyMessage(parts.join(' — '));
  }

  return 'Could not add content. See docs/SUPABASE_SETUP.md or run supabase/migration-v3-fix.sql.';
}

function mapFriendlyMessage(raw: string): string {
  const msg = raw.toLowerCase();

  if (msg.includes('not configured') || msg.includes('vite_supabase')) {
    return 'Supabase is not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Netlify, then redeploy.';
  }

  if (msg.includes('session') || msg.includes('jwt') || msg.includes('not authenticated')) {
    return 'Your session expired. Sign out, sign in again, then publish.';
  }

  if (msg.includes('row-level security') || msg.includes('policy')) {
    return 'Permission denied. Use pao51613@gmail.com or ploy.muennikorn@gmail.com, and run supabase/migration-v3-fix.sql in Supabase.';
  }

  if (msg.includes('bucket') && msg.includes('not found')) {
    return 'Storage bucket missing. In Supabase → Storage, create a public bucket named gallery-images.';
  }

  if (msg.includes('payload too large') || msg.includes('entity too large')) {
    return 'File is too large. Try a smaller photo or a shorter video (under ~50MB).';
  }

  if (msg.includes('column') && msg.includes('does not exist')) {
    return 'Database needs an update. In Supabase SQL Editor, run migration-v2.sql then migration-v3-fix.sql from the supabase folder.';
  }

  if (msg.includes('null value') && msg.includes('image_url')) {
    return 'Database needs migration-v3-fix.sql (image_url must allow videos). Run it in Supabase SQL Editor.';
  }

  if (msg.includes('duplicate') || msg.includes('already exists')) {
    return 'This file was already uploaded. Pick the photo again and publish.';
  }

  return raw;
}
