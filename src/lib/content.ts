import { formatSupabaseError } from './errors';
import { isUnlockedAt } from './unlock';
import { driveEmbedUrl, isDriveUrl, parseDriveShareLink } from './googleDrive';
import { getUploaderCredit, getUploaderName } from './uploader';
import type { ContentPostRow, MediaSource, MediaType, SiteContentItem } from '../types/content';
import { GALLERY_BUCKET, GALLERY_TABLE, isSupabaseConfigured, supabase } from './supabase';

/** How many newest posts appear in What's New */
export const WHATS_NEW_COUNT = 5;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

const SELECT_BASIC =
  'id, media_type, media_source, media_url, image_url, poster_url, drive_file_id, description, uploaded_by_email, unlock_at, created_at, sort_order, category_id';

const SELECT_FULL = `${SELECT_BASIC}, categories(id, name, slug)`;

type RowWithCategory = ContentPostRow & {
  categories?: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
};

function rowMediaUrl(row: ContentPostRow): string {
  return row.media_url ?? row.image_url ?? '';
}

function resolveMediaSource(row: ContentPostRow, url: string): MediaSource {
  if (row.media_source === 'drive' || row.media_source === 'supabase') return row.media_source;
  if (row.drive_file_id || isDriveUrl(url)) return 'drive';
  return 'supabase';
}

function categoryFromRow(row: RowWithCategory) {
  const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  return {
    categoryId: row.category_id ?? cat?.id ?? null,
    categoryName: cat?.name ?? null,
    categorySlug: cat?.slug ?? null,
  };
}

function toContentItem(row: RowWithCategory): SiteContentItem {
  const rawUrl = rowMediaUrl(row);
  const mediaSource = resolveMediaSource(row, rawUrl);
  const driveFileId = row.drive_file_id ?? undefined;
  let src = rawUrl;
  if (mediaSource === 'drive' && driveFileId) {
    src =
      row.media_type === 'photo'
        ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1600`
        : driveEmbedUrl(driveFileId);
  }

  const cat = categoryFromRow(row);

  return {
    id: row.id,
    mediaType: row.media_type === 'video' ? 'video' : 'photo',
    mediaSource,
    src,
    driveFileId,
    poster: row.poster_url ?? undefined,
    description: row.description,
    uploadedByEmail: row.uploaded_by_email,
    uploadedByLabel: getUploaderCredit(row.uploaded_by_email),
    unlockAt: row.unlock_at ?? new Date(0).toISOString(),
    createdAt: row.created_at,
    isStatic: false,
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    categorySlug: cat.categorySlug,
  };
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

async function insertRow(row: Record<string, unknown>): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.from(GALLERY_TABLE).insert(row);
  if (error) throw new Error(formatSupabaseError(error));
}

async function fetchAllPosts(): Promise<SiteContentItem[]> {
  if (!supabase) return [];

  const full = await supabase
    .from(GALLERY_TABLE)
    .select(SELECT_FULL)
    .order('created_at', { ascending: false });

  let rows: RowWithCategory[];

  if (full.error) {
    console.warn('Content fetch (with categories):', full.error.message);
    const basic = await supabase
      .from(GALLERY_TABLE)
      .select(SELECT_BASIC)
      .order('created_at', { ascending: false });
    if (basic.error) {
      console.warn('Content fetch:', basic.error.message);
      return [];
    }
    rows = (basic.data ?? []) as RowWithCategory[];
  } else {
    rows = (full.data ?? []) as RowWithCategory[];
  }

  return rows.map(toContentItem).filter((item) => item.src);
}

export async function fetchDbPosts(): Promise<SiteContentItem[]> {
  return fetchAllPosts();
}

/** Newest uploads — shown at the top of the site */
export async function fetchWhatsNewPosts(): Promise<SiteContentItem[]> {
  const all = await fetchAllPosts();
  return all.slice(0, WHATS_NEW_COUNT);
}

/** Everything in an episode category (not limited to What's New count) */
export async function fetchPostsByCategory(categoryId: string): Promise<SiteContentItem[]> {
  const all = await fetchAllPosts();
  return all.filter((p) => p.categoryId === categoryId);
}

export function isUnlocked(item: SiteContentItem, now = Date.now()): boolean {
  return isUnlockedAt(item.unlockAt, now);
}

export async function createPhotoPost(params: {
  file: File;
  description: string;
  unlockAt: Date;
  uploadedByEmail: string;
  categoryId: string;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not connected.');
  }

  await requireAuthSession();

  const { file, description, unlockAt, uploadedByEmail, categoryId } = params;

  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error('Photo is too large. Use an image under 15MB, or paste a Google Drive link instead.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `photos/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(GALLERY_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  });

  if (uploadError) throw new Error(formatSupabaseError(uploadError));

  const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  try {
    await insertRow({
      media_type: 'photo',
      media_source: 'supabase',
      media_url: publicUrl,
      image_url: publicUrl,
      description: description.trim(),
      uploaded_by_email: uploadedByEmail.trim().toLowerCase(),
      unlock_at: unlockAt.toISOString(),
      category_id: categoryId,
    });
  } catch (e) {
    await supabase.storage.from(GALLERY_BUCKET).remove([path]);
    throw e;
  }
}

export async function createDriveMediaPost(params: {
  fileId: string;
  mediaType: MediaType;
  description: string;
  unlockAt: Date;
  uploadedByEmail: string;
  categoryId: string;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not connected.');

  await requireAuthSession();

  const embedUrl = driveEmbedUrl(params.fileId);
  const email = params.uploadedByEmail.trim().toLowerCase();

  await insertRow({
    media_type: params.mediaType,
    media_source: 'drive',
    media_url: embedUrl,
    image_url:
      params.mediaType === 'photo'
        ? `https://drive.google.com/thumbnail?id=${params.fileId}&sz=w1600`
        : embedUrl,
    drive_file_id: params.fileId,
    description: params.description.trim(),
    uploaded_by_email: email,
    unlock_at: params.unlockAt.toISOString(),
    category_id: params.categoryId,
  });
}

export async function createFromDriveLink(params: {
  driveShareLink: string;
  mediaType: MediaType;
  description: string;
  unlockAt: Date;
  uploadedByEmail: string;
  categoryId: string;
}): Promise<void> {
  const parsed = parseDriveShareLink(params.driveShareLink);
  if (!parsed) {
    throw new Error('Invalid Google Drive link. Set sharing to “Anyone with the link”, then paste the URL.');
  }

  await createDriveMediaPost({
    fileId: parsed.fileId,
    mediaType: params.mediaType,
    description: params.description,
    unlockAt: params.unlockAt,
    uploadedByEmail: params.uploadedByEmail,
    categoryId: params.categoryId,
  });
}

export async function updatePostCategory(postId: string, categoryId: string | null): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  await requireAuthSession();

  const { error } = await supabase
    .from(GALLERY_TABLE)
    .update({ category_id: categoryId })
    .eq('id', postId);

  if (error) throw new Error(formatSupabaseError(error));
}

export async function deleteContentPost(item: SiteContentItem): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.from(GALLERY_TABLE).delete().eq('id', item.id);
  if (error) throw new Error(formatSupabaseError(error));

  if (item.mediaSource !== 'supabase') return;

  try {
    const marker = `/storage/v1/object/public/${GALLERY_BUCKET}/`;
    const idx = item.src.indexOf(marker);
    if (idx !== -1) {
      const storagePath = decodeURIComponent(item.src.slice(idx + marker.length));
      await supabase.storage.from(GALLERY_BUCKET).remove([storagePath]);
    }
  } catch {
    /* best-effort */
  }
}

export { getUploaderName };
