-- Advisor flagged these SECURITY DEFINER functions as directly callable via
-- PostgREST RPC (/rest/v1/rpc/<fn>). None are meant to be public endpoints:
-- the two trigger functions only need to fire as triggers (which doesn't
-- require EXECUTE on the invoking role), and the two membership-check
-- helpers are only meant to be evaluated inside RLS policies for
-- `authenticated` — never called directly, and never by `anon`.
revoke execute on function public.log_prospect_stage_change() from anon, authenticated;
revoke execute on function public.bump_prospect_last_contacted() from anon, authenticated;

revoke execute on function public.is_crm_member() from anon;
revoke execute on function public.is_crm_admin() from anon;
-- authenticated keeps EXECUTE on is_crm_member/is_crm_admin: RLS policies
-- evaluate them as the querying role, which requires this grant.
;
