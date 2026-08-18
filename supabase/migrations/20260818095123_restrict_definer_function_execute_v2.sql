-- New functions default to EXECUTE granted to PUBLIC (every role, incl.
-- anon/authenticated, is implicitly a member of PUBLIC) — revoking from
-- anon/authenticated directly didn't clear that broader grant. Revoke from
-- PUBLIC explicitly, then re-grant only what's actually needed.
revoke execute on function public.log_prospect_stage_change() from public;
revoke execute on function public.bump_prospect_last_contacted() from public;
revoke execute on function public.is_crm_member() from public;
revoke execute on function public.is_crm_admin() from public;

-- RLS policies evaluate these two as the querying (authenticated) role.
grant execute on function public.is_crm_member() to authenticated;
grant execute on function public.is_crm_admin() to authenticated;
;
