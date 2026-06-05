-- Run this in Supabase: SQL Editor → New query → Run

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories_public_read"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "categories_admin_insert"
  on public.categories for insert
  to authenticated
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create policy "categories_admin_update"
  on public.categories for update
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create policy "categories_admin_delete"
  on public.categories for delete
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create table if not exists public.sub_sections (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, slug)
);

alter table public.sub_sections enable row level security;

create policy "sub_sections_public_read"
  on public.sub_sections for select
  to anon, authenticated
  using (true);

create policy "sub_sections_admin_insert"
  on public.sub_sections for insert
  to authenticated
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create policy "sub_sections_admin_update"
  on public.sub_sections for update
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create policy "sub_sections_admin_delete"
  on public.sub_sections for delete
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create table if not exists public.gallery_posts (
  id uuid primary key default gen_random_uuid(),
  media_type text not null default 'photo' check (media_type in ('photo', 'video')),
  media_source text not null default 'supabase' check (media_source in ('supabase', 'drive')),
  media_url text,
  image_url text,
  poster_url text,
  drive_file_id text,
  description text not null default '',
  uploaded_by_email text,
  unlock_at timestamptz not null default now(),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  category_id uuid references public.categories(id) on delete set null,
  sub_section_id uuid references public.sub_sections(id) on delete set null
);

alter table public.gallery_posts enable row level security;

create policy "gallery_posts_public_read"
  on public.gallery_posts
  for select
  to anon, authenticated
  using (true);

create policy "gallery_posts_admin_insert"
  on public.gallery_posts
  for insert
  to authenticated
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create policy "gallery_posts_admin_update"
  on public.gallery_posts
  for update
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create policy "gallery_posts_admin_delete"
  on public.gallery_posts
  for delete
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

insert into storage.buckets (id, name, public)
values ('gallery-images', 'gallery-images', true)
on conflict (id) do nothing;

create policy "gallery_images_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'gallery-images');

create policy "gallery_images_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'gallery-images'
    and lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create policy "gallery_images_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'gallery-images'
    and lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  unlock_at timestamptz not null default now(),
  uploaded_by_email text,
  created_at timestamptz not null default now()
);

alter table public.letters enable row level security;

create policy "letters_public_read"
  on public.letters for select
  to anon, authenticated
  using (true);

create policy "letters_admin_insert"
  on public.letters for insert
  to authenticated
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create policy "letters_admin_update"
  on public.letters for update
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

create policy "letters_admin_delete"
  on public.letters for delete
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );
