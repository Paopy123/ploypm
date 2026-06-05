-- Sub-memories inside each episode (run in Supabase SQL Editor)

create table if not exists public.sub_sections (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, slug)
);

create index if not exists sub_sections_category_id_idx on public.sub_sections(category_id);

alter table public.gallery_posts
  add column if not exists sub_section_id uuid references public.sub_sections(id) on delete set null;

create index if not exists gallery_posts_sub_section_id_idx on public.gallery_posts(sub_section_id);

alter table public.sub_sections enable row level security;

drop policy if exists "sub_sections_public_read" on public.sub_sections;
create policy "sub_sections_public_read"
  on public.sub_sections for select
  to anon, authenticated
  using (true);

drop policy if exists "sub_sections_admin_insert" on public.sub_sections;
create policy "sub_sections_admin_insert"
  on public.sub_sections for insert
  to authenticated
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

drop policy if exists "sub_sections_admin_update" on public.sub_sections;
create policy "sub_sections_admin_update"
  on public.sub_sections for update
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

drop policy if exists "sub_sections_admin_delete" on public.sub_sections;
create policy "sub_sections_admin_delete"
  on public.sub_sections for delete
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );
