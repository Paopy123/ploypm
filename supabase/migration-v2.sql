-- Run in Supabase SQL Editor if you already ran schema.sql (v1)

alter table public.gallery_posts
  add column if not exists media_type text not null default 'photo',
  add column if not exists media_url text,
  add column if not exists poster_url text,
  add column if not exists uploaded_by_email text,
  add column if not exists unlock_at timestamptz not null default now();

update public.gallery_posts
set media_url = image_url
where media_url is null and image_url is not null;

-- Optional: make image_url nullable for new rows
-- alter table public.gallery_posts alter column image_url drop not null;
