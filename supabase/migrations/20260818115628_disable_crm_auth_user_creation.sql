-- The CRM uses its own shared-password gate and must never create Supabase Auth users.
create or replace function public.reject_crm_auth_user_creation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using
    errcode = '42501',
    message = 'Supabase Auth is disabled for Petabook CRM.';
end;
$$;

revoke all on function public.reject_crm_auth_user_creation() from public, anon, authenticated;

drop trigger if exists reject_crm_auth_user_creation on auth.users;
create trigger reject_crm_auth_user_creation
before insert on auth.users
for each row execute function public.reject_crm_auth_user_creation();
