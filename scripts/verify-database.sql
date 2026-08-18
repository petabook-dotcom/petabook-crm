select jsonb_build_object(
  'forbidden_columns', (
    select coalesce(jsonb_agg(table_name || '.' || column_name), '[]'::jsonb)
    from information_schema.columns
    where table_schema = 'public'
      and column_name in ('owner_id', 'hotel_id', 'hotel_slug', 'hotel_is_partner', 'hotel_synced_at', 'created_by')
      and table_name in ('prospects', 'prospect_activities', 'outreach_touches')
  ),
  'crm_members_exists', to_regclass('public.crm_members') is not null,
  'membership_functions', (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('is_crm_member', 'is_crm_admin')
  ),
  'stages', (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conname = 'prospects_funnel_stage_check'
  ),
  'activity_types', (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conname = 'prospect_activities_type_check'
  ),
  'rls', (
    select jsonb_object_agg(relname, relrowsecurity)
    from pg_class
    where oid in (
      'public.prospects'::regclass,
      'public.prospect_contacts'::regclass,
      'public.prospect_activities'::regclass,
      'public.outreach_touches'::regclass
    )
  ),
  'policies', (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename in ('prospects', 'prospect_contacts', 'prospect_activities', 'outreach_touches')
  ),
  'anon_select', has_table_privilege('anon', 'public.prospects', 'select'),
  'authenticated_select', has_table_privilege('authenticated', 'public.prospects', 'select'),
  'service_select', has_table_privilege('service_role', 'public.prospects', 'select'),
  'service_insert', has_table_privilege('service_role', 'public.prospects', 'insert')
) as verification;
