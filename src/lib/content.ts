import { PHOTOS } from '../content';
import { formatSupabaseError } from './errors';
import { driveEmbedUrl, isDriveUrl, parseDriveShareLink } from './googleDrive';
import { getUploaderCredit, getUploaderName } from './uploader';
import type { ContentPostRow, MediaSource, MediaType, SiteContentItem } from '../types/content';
import { GALLERY_BUCKET, GALLERY_TABLE, isSupabaseConfigured, supabase } from './supabase';

const WHATS_NEW_DAYS = 14;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

function rowMediaUrl(row: ContentPostRow): string {
  return row.media_url ?? row.image_url ?? '';
}

function resolveMediaSource(row: ContentPostRow, url: string): MediaSource {
  if (row.media_source === 'drive' || row.media_source === 'supabase') {
    return row.media_source;
  }
  if (row.drive_file_id || isDriveUrl(url)) return 'drive';
  return 'supabase';
}

function toContentItem(row: ContentPostRow): SiteContentItem {
  const createdAt = row.created_at;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const isNew = ageMs < WHATS_NEW_DAYS * 24 * 60 * 60 * 1000;
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
    createdAt,
    isStatic: false,
    isNew,
  };
}

function staticPhotoItems(): SiteContentItem[] {
  return PHOTOS.map((photo, index) => ({
    id: `static-${index}`,
    mediaType: 'photo' as const,
    mediaSource: 'supabase' as const,
    src: photo.src,
    description: photo.alt,
    uploadedByEmail: null,
    uploadedByLabel: null,
    unlockAt: new Date(0).toISOString(),
    createdAt: new Date(0).toISOString(),
    isStatic: true,
    isNew: false,
  }));
}

const SELECT_FULL =
  'id, media_type, media_source, media_url, image_url, poster_url, drive_file_id, description, uploaded_by_email, unlock_at, created_at, sort_order';

const SELECT_LEGACY = 'id, image_url, description, sort_order, created_at';

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

  let { error } = await supabase.from(GALLERY_TABLE).insert(row);

  if (error?.message?.includes('does not exist')) {
    const { media_type, media_source, drive_file_id, unlock_at, uploaded_by_email, ...rest } = row;
    void media_type;
    void media_source;
    void drive_file_id;
    void unlock_at;
    void uploaded_by_email;
    ({ error } = await supabase.from(GALLERY_TABLE).insert(rest));
  }

  if (error) throw new Error(formatSupabaseError(error));
}

export async function fetchDbPosts(): Promise<SiteContentItem[]> {
  if (!supabase) return [];

  let { data, error } = await supabase
    .from(GALLERY_TABLE)
    .select(SELECT_FULL)
    .order('created_at', { ascending: false });

  if (error?.message?.includes('does not exist')) {
    const legacy = await supabase
      .from(GALLERY_TABLE)
      .select(SELECT_LEGACY)
      .order('created_at', { ascending: false });
    data = legacy.data as typeof data;
    error = legacy.error;
  }

  if (error) {
    console.warn('Content fetch:', error.message);
    return [];
  }

  return ((data ?? []) as ContentPostRow[])
    .map((row) =>
      toContentItem({
        ...row,
        media_type: row.media_type ?? 'photo',
        media_url: row.media_url ?? row.image_url,
        unlock_at: row.unlock_at ?? row.created_at,
      }),
    )
    .filter((item) => item.src);
}

export async function fetchPhotoItems(): Promise<SiteContentItem[]> {
  const dbPhotos = (await fetchDbPosts()).filter((p) => p.mediaType === 'photo');
  return [...dbPhotos, ...staticPhotoItems()];
}

export async function fetchVideoItems(): Promise<SiteContentItem[]> {
  return (await fetchDbPosts()).filter((p) => p.mediaType === 'video');
}

export function isUnlocked(item: SiteContentItem, now = Date.now()): boolean {
  return new Date(item.unlockAt).getTime() <= now;
}

/** Photos only — stored in Supabase (keep under ~15MB) */
export async function createPhotoPost(params: {
  file: File;
  description: string;
  unlockAt: Date;
  uploadedByEmail: string;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Netlify, then redeploy.',
    );
  }

  await requireAuthSession();

  const { file, description, unlockAt, uploadedByEmail } = params;

  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error('Photo is too large. Use an image under 15MB, or compress it first.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `photos/${crypto.randomUUID()}.${ext}`;
  const contentType = file.type || 'image/jpeg';

  const { error: uploadError } = await supabase.storage.from(GALLERY_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType,
  });

  if (uploadError) {
    throw new Error(formatSupabaseError(uploadError));
  }

  const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;
  const email = uploadedByEmail.trim().toLowerCase();

  try {
    await insertRow({
      media_type: 'photo',
      media_source: 'supabase',
      media_url: publicUrl,
      image_url: publicUrl,
      description: description.trim(),
      uploaded_by_email: email,
      unlock_at: unlockAt.toISOString(),
    });
  } catch (e) {
    await supabase.storage.from(GALLERY_BUCKET).remove([path]);
    throw e;
  }
}

/** Save a Drive file (auto-upload or pasted link) to the site database */
export async function createDriveMediaPost(params: {
  fileId: string;
  mediaType: MediaType;
  description: string;
  unlockAt: Date;
  uploadedByEmail: string;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not connected.');
  }

  await requireAuthSession();

  const embedUrl = driveEmbedUrl(params.fileId);
  const email = params.uploadedByEmail.trim().toLowerCase();

  await insertRow({
    media_type: params.mediaType,
    media_source: 'drive',
    media_url: embedUrl,
    image_url: params.mediaType === 'photo' ? `https://drive.google.com/thumbnail?id=${params.fileId}&sz=w1600` : embedUrl,
    drive_file_id: params.fileId,
    description: params.description.trim(),
    uploaded_by_email: email,
    unlock_at: params.unlockAt.toISOString(),
  });
}

/** Videos — paste a share link (manual upload to Drive) */
export async function createVideoFromDriveLink(params: {
  driveShareLink: string;
  description: string;
  unlockAt: Date;
  uploadedByEmail: string;
}): Promise<void> {
  const parsed = parseDriveShareLink(params.driveShareLink);
  if (!parsed) {
    throw new Error(
      'Invalid Google Drive link. Set sharing to “Anyone with the link”, then paste the URL.',
    );
  }

  await createDriveMediaPost({
    fileId: parsed.fileId,
    mediaType: 'video',
    description: params.description,
    unlockAt: params.unlockAt,
    uploadedByEmail: params.uploadedByEmail,
  });
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
