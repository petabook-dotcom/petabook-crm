-- SECURITY DEFINER helpers so membership checks don't have to re-evaluate
-- crm_members' own RLS policy inside every other table's policy (and so
-- the crm_members policies themselves read cleanly instead of a
-- self-referencing subquery).
create or replace function public.is_crm_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.crm_members where user_id = auth.uid());
$$;

create or replace function public.is_crm_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.crm_members where user_id = auth.uid() and role = 'admin');
$$;

drop policy if exists "crm_members_select_authenticated" on public.crm_members;
drop policy if exists "crm_members_admin_write" on public.crm_members;

create policy "crm_members_select_authenticated"
  on public.crm_members for select
  to authenticated
  using (public.is_crm_member());

create policy "crm_members_admin_write"
  on public.crm_members for all
  to authenticated
  using (public.is_crm_admin())
  with check (public.is_crm_admin());

-- Both reference CRMs shipped with RLS off (or "using (true)") and full
-- CRUD granted to anon. Here: RLS is always on, anon gets nothing, and
-- every policy requires a crm_members row. Delete is admin-only.

alter table public.prospects enable row level security;
alter table public.prospect_contacts enable row level security;
alter table public.prospect_activities enable row level security;
alter table public.outreach_touches enable row level security;

create policy "prospects_select_members" on public.prospects
  for select to authenticated using (public.is_crm_member());
create policy "prospects_insert_members" on public.prospects
  for insert to authenticated with check (public.is_crm_member());
create policy "prospects_update_members" on public.prospects
  for update to authenticated using (public.is_crm_member()) with check (public.is_crm_member());
create policy "prospects_delete_admin" on public.prospects
  for delete to authenticated using (public.is_crm_admin());

create policy "prospect_contacts_select_members" on public.prospect_contacts
  for select to authenticated using (public.is_crm_member());
create policy "prospect_contacts_insert_members" on public.prospect_contacts
  for insert to authenticated with check (public.is_crm_member());
create policy "prospect_contacts_update_members" on public.prospect_contacts
  for update to authenticated using (public.is_crm_member()) with check (public.is_crm_member());
create policy "prospect_contacts_delete_members" on public.prospect_contacts
  for delete to authenticated using (public.is_crm_member());

create policy "prospect_activities_select_members" on public.prospect_activities
  for select to authenticated using (public.is_crm_member());
create policy "prospect_activities_insert_members" on public.prospect_activities
  for insert to authenticated with check (public.is_crm_member());
create policy "prospect_activities_delete_admin" on public.prospect_activities
  for delete to authenticated using (public.is_crm_admin());
-- No update policy: activities are an append-only audit log, matching
-- crm-oeiras360's "reports are immutable once filed" precedent.

create policy "outreach_touches_select_members" on public.outreach_touches
  for select to authenticated using (public.is_crm_member());
create policy "outreach_touches_insert_members" on public.outreach_touches
  for insert to authenticated with check (public.is_crm_member());
create policy "outreach_touches_update_members" on public.outreach_touches
  for update to authenticated using (public.is_crm_member()) with check (public.is_crm_member());
create policy "outreach_touches_delete_admin" on public.outreach_touches
  for delete to authenticated using (public.is_crm_admin());
;
