-- Cover FKs the linter flagged (join/lookup performance once these tables
-- have real rows).
create index if not exists outreach_touches_contact_id_idx on public.outreach_touches (contact_id);
create index if not exists outreach_touches_created_by_idx on public.outreach_touches (created_by);
create index if not exists prospect_activities_created_by_idx on public.prospect_activities (created_by);

-- crm_members had two permissive SELECT policies for `authenticated`
-- (select-all-members + admin-write-all), each evaluated per row. Split
-- admin's policy into per-action rules that don't include SELECT, so only
-- one policy fires on reads.
drop policy if exists "crm_members_admin_write" on public.crm_members;

create policy "crm_members_admin_insert" on public.crm_members
  for insert to authenticated with check (public.is_crm_admin());
create policy "crm_members_admin_update" on public.crm_members
  for update to authenticated using (public.is_crm_admin()) with check (public.is_crm_admin());
create policy "crm_members_admin_delete" on public.crm_members
  for delete to authenticated using (public.is_crm_admin());
;
