/** Parse a Google Drive share link into a file ID */
export function extractDriveFileId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const fromPath = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (fromPath?.[1]) return fromPath[1];

    const fromQuery = url.searchParams.get('id');
    if (fromQuery) return fromQuery;
  } catch {
    /* not a full URL — try raw ID */
  }

  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes('/')) {
    return trimmed;
  }

  return null;
}

/** Embed URL for in-page playback (file must be shared: anyone with the link) */
export function driveEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function driveOpenUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function parseDriveShareLink(shareLink: string): { fileId: string; embedUrl: string } | null {
  const fileId = extractDriveFileId(shareLink);
  if (!fileId) return null;
  return { fileId, embedUrl: driveEmbedUrl(fileId) };
}

export function isDriveUrl(url: string): boolean {
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}
