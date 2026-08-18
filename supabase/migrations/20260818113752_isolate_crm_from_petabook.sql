-- Forward cleanup for the already-initialized dedicated CRM project.
update public.prospects set funnel_stage = 'Onboarding' where funnel_stage = 'Partner';
update public.prospect_activities set type = 'note' where type = 'handoff';

drop policy if exists "prospects_select_members" on public.prospects;
drop policy if exists "prospects_insert_members" on public.prospects;
drop policy if exists "prospects_update_members" on public.prospects;
drop policy if exists "prospects_delete_admin" on public.prospects;
drop policy if exists "prospect_contacts_select_members" on public.prospect_contacts;
drop policy if exists "prospect_contacts_insert_members" on public.prospect_contacts;
drop policy if exists "prospect_contacts_update_members" on public.prospect_contacts;
drop policy if exists "prospect_contacts_delete_members" on public.prospect_contacts;
drop policy if exists "prospect_activities_select_members" on public.prospect_activities;
drop policy if exists "prospect_activities_insert_members" on public.prospect_activities;
drop policy if exists "prospect_activities_delete_admin" on public.prospect_activities;
drop policy if exists "outreach_touches_select_members" on public.outreach_touches;
drop policy if exists "outreach_touches_insert_members" on public.outreach_touches;
drop policy if exists "outreach_touches_update_members" on public.outreach_touches;
drop policy if exists "outreach_touches_delete_admin" on public.outreach_touches;

drop index if exists public.prospects_owner_id_idx;
drop index if exists public.prospects_hotel_id_idx;
drop index if exists public.outreach_touches_created_by_idx;
drop index if exists public.prospect_activities_created_by_idx;

alter table public.prospects
  drop column if exists owner_id,
  drop column if exists hotel_id,
  drop column if exists hotel_slug,
  drop column if exists hotel_is_partner,
  drop column if exists hotel_synced_at;

alter table public.prospect_activities drop column if exists created_by;
alter table public.outreach_touches drop column if exists created_by;

alter table public.prospects drop constraint if exists prospects_funnel_stage_check;
alter table public.prospects add constraint prospects_funnel_stage_check
  check (funnel_stage in ('Prospect', 'Contacted', 'Engaged', 'Meeting', 'Proposal', 'Onboarding', 'Lost', 'On Hold'));

alter table public.prospect_activities drop constraint if exists prospect_activities_type_check;
alter table public.prospect_activities add constraint prospect_activities_type_check
  check (type in ('note', 'email', 'call', 'whatsapp', 'meeting', 'visit', 'stage_change'));

do $$
begin
  if to_regclass('public.crm_members') is not null then
    execute 'drop policy if exists "crm_members_select_authenticated" on public.crm_members';
    execute 'drop policy if exists "crm_members_admin_write" on public.crm_members';
    execute 'drop policy if exists "crm_members_admin_insert" on public.crm_members';
    execute 'drop policy if exists "crm_members_admin_update" on public.crm_members';
    execute 'drop policy if exists "crm_members_admin_delete" on public.crm_members';
  end if;
end
$$;
drop function if exists public.is_crm_member();
drop function if exists public.is_crm_admin();
drop table if exists public.crm_members;

alter table public.prospects enable row level security;
alter table public.prospect_contacts enable row level security;
alter table public.prospect_activities enable row level security;
alter table public.outreach_touches enable row level security;

revoke all on table public.prospects from public, anon, authenticated;
revoke all on table public.prospect_contacts from public, anon, authenticated;
revoke all on table public.prospect_activities from public, anon, authenticated;
revoke all on table public.outreach_touches from public, anon, authenticated;

grant select, insert, update, delete on table public.prospects to service_role;
grant select, insert, update, delete on table public.prospect_contacts to service_role;
grant select, insert, update, delete on table public.prospect_activities to service_role;
grant select, insert, update, delete on table public.outreach_touches to service_role;

revoke execute on function public.log_prospect_stage_change() from public, anon, authenticated;
revoke execute on function public.bump_prospect_last_contacted() from public, anon, authenticated;
