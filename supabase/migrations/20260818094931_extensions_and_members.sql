-- Extensions needed by compute_identity_key() (unaccent for name folding,
-- pgcrypto/uuid-ossp already present on this project but declared here for
-- completeness and idempotency).
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Who is allowed into the CRM at all. Referenced by every RLS policy below.
-- A user with a Supabase Auth account but no row here can authenticate but
-- reads/writes everywhere are denied.
create table if not exists public.crm_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null default 'sales' check (role in ('admin', 'sales')),
  created_at timestamptz not null default now()
);

alter table public.crm_members enable row level security;

-- Members can see the roster (to attribute activities to colleagues by
-- name); only admins manage membership itself.
create policy "crm_members_select_authenticated"
  on public.crm_members for select
  to authenticated
  using (exists (select 1 from public.crm_members m where m.user_id = auth.uid()));

create policy "crm_members_admin_write"
  on public.crm_members for all
  to authenticated
  using (exists (select 1 from public.crm_members m where m.user_id = auth.uid() and m.role = 'admin'))
  with check (exists (select 1 from public.crm_members m where m.user_id = auth.uid() and m.role = 'admin'));
;
