export type MediaType = 'photo' | 'video';
export type MediaSource = 'supabase' | 'drive';

export type ContentPostRow = {
  id: string;
  media_type: MediaType;
  media_source?: MediaSource | string | null;
  media_url: string | null;
  image_url: string | null;
  poster_url: string | null;
  drive_file_id?: string | null;
  description: string;
  uploaded_by_email: string | null;
  unlock_at?: string;
  created_at: string;
  sort_order: number;
};

export type SiteContentItem = {
  id: string;
  mediaType: MediaType;
  mediaSource: MediaSource;
  src: string;
  driveFileId?: string;
  poster?: string;
  description: string;
  uploadedByEmail: string | null;
  uploadedByLabel: string | null;
  unlockAt: string;
  createdAt: string;
  isStatic: boolean;
  isNew: boolean;
};
