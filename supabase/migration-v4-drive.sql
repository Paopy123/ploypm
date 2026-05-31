-- Google Drive videos (no Supabase storage for video files)
alter table public.gallery_posts
  add column if not exists media_source text default 'supabase',
  add column if not exists drive_file_id text;
