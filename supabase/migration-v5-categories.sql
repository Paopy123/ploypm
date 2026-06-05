-- Episodes / categories (run in Supabase SQL Editor)

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.gallery_posts
  add column if not exists category_id uuid references public.categories(id) on delete set null;

create index if not exists gallery_posts_category_id_idx on public.gallery_posts(category_id);
create index if not exists gallery_posts_created_at_idx on public.gallery_posts(created_at desc);

alter table public.categories enable row level security;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "categories_admin_insert" on public.categories;
create policy "categories_admin_insert"
  on public.categories for insert
  to authenticated
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

drop policy if exists "categories_admin_update" on public.categories;
create policy "categories_admin_update"
  on public.categories for update
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_admin_delete"
  on public.categories for delete
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );
