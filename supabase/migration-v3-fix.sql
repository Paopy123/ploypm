-- Run this in Supabase SQL Editor if Publish fails
-- Safe to run more than once

-- 1) Columns from v2 (skip if already applied)
alter table public.gallery_posts
  add column if not exists media_type text default 'photo',
  add column if not exists media_url text,
  add column if not exists poster_url text,
  add column if not exists uploaded_by_email text,
  add column if not exists unlock_at timestamptz default now();

update public.gallery_posts
set media_url = image_url
where media_url is null and image_url is not null;

update public.gallery_posts
set media_type = 'photo'
where media_type is null;

-- 2) Videos need image_url to be optional (old schema required it)
alter table public.gallery_posts alter column image_url drop not null;

-- 3) Storage bucket
insert into storage.buckets (id, name, public)
values ('gallery-images', 'gallery-images', true)
on conflict (id) do update set public = true;

-- 4) Fix RLS policies (auth email check)
drop policy if exists "gallery_posts_public_read" on public.gallery_posts;
drop policy if exists "gallery_posts_admin_insert" on public.gallery_posts;
drop policy if exists "gallery_posts_admin_update" on public.gallery_posts;
drop policy if exists "gallery_posts_admin_delete" on public.gallery_posts;

alter table public.gallery_posts enable row level security;

create policy "gallery_posts_public_read"
  on public.gallery_posts for select
  to anon, authenticated
  using (true);

create policy "gallery_posts_admin_insert"
  on public.gallery_posts for insert
  to authenticated
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create policy "gallery_posts_admin_update"
  on public.gallery_posts for update
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create policy "gallery_posts_admin_delete"
  on public.gallery_posts for delete
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

-- 5) Storage policies
drop policy if exists "gallery_images_public_read" on storage.objects;
drop policy if exists "gallery_images_admin_insert" on storage.objects;
drop policy if exists "gallery_images_admin_delete" on storage.objects;

create policy "gallery_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'gallery-images');

create policy "gallery_images_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'gallery-images'
    and lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create policy "gallery_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'gallery-images'
    and lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );
