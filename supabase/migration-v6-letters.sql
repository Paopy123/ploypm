-- Love letters (run in Supabase SQL Editor)

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  unlock_at timestamptz not null default now(),
  uploaded_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists letters_created_at_idx on public.letters(created_at desc);

alter table public.letters enable row level security;

drop policy if exists "letters_public_read" on public.letters;
create policy "letters_public_read"
  on public.letters for select
  to anon, authenticated
  using (true);

drop policy if exists "letters_admin_insert" on public.letters;
create policy "letters_admin_insert"
  on public.letters for insert
  to authenticated
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

drop policy if exists "letters_admin_update" on public.letters;
create policy "letters_admin_update"
  on public.letters for update
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );

drop policy if exists "letters_admin_delete" on public.letters;
create policy "letters_admin_delete"
  on public.letters for delete
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pao51613@gmail.com',
      'ploy.muennikorn@gmail.com'
    )
  );
