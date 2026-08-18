-- Fixes the #1 gap in both reference CRMs: a dog hotel has an owner, a
-- manager, and a front-desk email, not one flat contact_name/email pair.
create table if not exists public.prospect_contacts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  whatsapp text,
  linkedin_url text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospect_contacts_prospect_id_idx on public.prospect_contacts (prospect_id);

-- At most one primary contact per prospect.
create unique index if not exists prospect_contacts_one_primary_idx
  on public.prospect_contacts (prospect_id)
  where is_primary;

drop trigger if exists set_prospect_contacts_updated_at on public.prospect_contacts;
create trigger set_prospect_contacts_updated_at
  before update on public.prospect_contacts
  for each row
  execute function public.set_updated_at();

create table if not exists public.prospect_activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  type text not null
    constraint prospect_activities_type_check
    check (type in ('note', 'email', 'call', 'whatsapp', 'meeting', 'visit', 'stage_change', 'handoff')),
  body text,
  metadata jsonb not null default '{}',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists prospect_activities_prospect_id_occurred_at_idx
  on public.prospect_activities (prospect_id, occurred_at desc);
create index if not exists prospect_activities_occurred_at_idx
  on public.prospect_activities (occurred_at desc);

-- Now that prospect_activities exists, wire up the stage-change auditor
-- defined in the previous migration.
drop trigger if exists log_prospect_stage_change on public.prospects;
create trigger log_prospect_stage_change
  after update of funnel_stage on public.prospects
  for each row
  when (old.funnel_stage is distinct from new.funnel_stage)
  execute function public.log_prospect_stage_change();

-- Outreach touches keep the prospect's "last contacted" honest, in a
-- trigger rather than app code so every writer (app, and later n8n) is
-- covered without duplicating the logic.
create or replace function public.bump_prospect_last_contacted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type in ('email', 'call', 'whatsapp', 'meeting', 'visit') then
    update public.prospects
    set last_contacted_at = new.occurred_at::date
    where id = new.prospect_id
      and (last_contacted_at is null or last_contacted_at < new.occurred_at::date);
  end if;
  return new;
end;
$$;

drop trigger if exists bump_prospect_last_contacted on public.prospect_activities;
create trigger bump_prospect_last_contacted
  after insert on public.prospect_activities
  for each row
  execute function public.bump_prospect_last_contacted();

-- Outreach modelled as data from day one (both reference CRMs left this as
-- prose in a Markdown file). v1 writes these rows when a touch is logged
-- manually; a future n8n integration writes the same rows with no
-- migration required.
create table if not exists public.outreach_touches (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  contact_id uuid references public.prospect_contacts (id) on delete set null,
  channel text not null check (channel in ('email', 'call', 'whatsapp', 'meeting', 'visit', 'other')),
  template_slug text,
  sequence_step integer not null default 1,
  thread_id text,
  subject text,
  body text,
  sent_at timestamptz,
  replied_at timestamptz,
  bounced_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists outreach_touches_prospect_id_idx on public.outreach_touches (prospect_id);
create index if not exists outreach_touches_thread_id_idx on public.outreach_touches (thread_id);
;
