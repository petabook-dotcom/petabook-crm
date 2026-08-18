-- Deterministic dedup key: email -> phone (>=7 digits) -> website host ->
-- unaccent(name)|city. Mirrored byte-for-byte in TS (lib/prospects.ts) so
-- app-created and (future) n8n-imported prospects dedup against each other.
-- Adapted from vektrum-crm / crm-oeiras360's compute_identity_key, swapping
-- their LinkedIn-URL fallback for a website-host fallback since dog hotels
-- are found by website far more often than by LinkedIn.
create or replace function public.compute_identity_key(
  p_email text,
  p_phone text,
  p_website text,
  p_business_name text,
  p_city text
)
returns text
language sql
stable
set search_path = public, extensions
as $$
  select encode(
    digest(
      coalesce(
        nullif(lower(trim(coalesce(p_email, ''))), ''),
        case
          when length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 7
            then regexp_replace(p_phone, '\D', '', 'g')
        end,
        nullif(
          regexp_replace(
            regexp_replace(lower(trim(coalesce(p_website, ''))), '^https?://(www\.)?', ''),
            '/.*$', ''
          ),
          ''
        ),
        regexp_replace(lower(unaccent(coalesce(p_business_name, ''))), '[^a-z0-9]', '', 'g')
          || '|' ||
          regexp_replace(lower(unaccent(coalesce(p_city, ''))), '[^a-z0-9]', '', 'g')
      ),
      'sha256'
    ),
    'hex'
  );
$$;

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  identity_key text unique,

  business_name text not null,
  legal_name text,
  region text not null default 'Desconhecido',
  sub_region text,
  city text not null default 'Desconhecido',
  address text,
  country text not null default 'PT',

  email text,
  phone text,
  website text,
  instagram_url text,
  facebook_url text,
  google_maps_url text,

  source text,
  funnel_stage text not null default 'Prospect'
    constraint prospects_funnel_stage_check
    check (
      funnel_stage in (
        'Prospect', 'Contacted', 'Engaged', 'Meeting', 'Proposal',
        'Onboarding', 'Partner', 'Lost', 'On Hold'
      )
    ),
  segment text not null default 'Por classificar',
  notes text,
  prospect_score numeric(6, 2),
  tags text[] not null default '{}',

  last_contacted_at date,
  preferred_channel text
    constraint prospects_preferred_channel_check
    check (preferred_channel is null or preferred_channel in ('Email', 'Telefone', 'WhatsApp')),
  next_action_at date,
  next_action_note text,

  owner_id uuid references auth.users (id) on delete set null,

  -- Soft reference to the Petabook prod hotels table (a different Supabase
  -- project) — see lib/petabook/. Not a real FK on purpose.
  hotel_id uuid,
  hotel_slug text,
  hotel_is_partner boolean not null default false,
  hotel_synced_at timestamptz,

  import_source text,
  import_payload jsonb not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospects_funnel_stage_idx on public.prospects (funnel_stage);
create index if not exists prospects_segment_idx on public.prospects (segment);
create index if not exists prospects_region_idx on public.prospects (region);
create index if not exists prospects_last_contacted_at_idx on public.prospects (last_contacted_at);
create index if not exists prospects_next_action_at_idx on public.prospects (next_action_at);
create index if not exists prospects_owner_id_idx on public.prospects (owner_id);
create index if not exists prospects_hotel_id_idx on public.prospects (hotel_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_prospects_updated_at on public.prospects;
create trigger set_prospects_updated_at
  before update on public.prospects
  for each row
  execute function public.set_updated_at();

-- Audit trail written by a trigger, not app code, so the timeline is
-- correct no matter who moves the stage (app, SQL, or a future n8n
-- workflow). Ported from vektrum-crm's log_lead_stage_change.
create or replace function public.log_prospect_stage_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.prospect_activities (prospect_id, type, body, metadata)
  values (
    new.id,
    'stage_change',
    old.funnel_stage || ' → ' || new.funnel_stage,
    jsonb_build_object('from', old.funnel_stage, 'to', new.funnel_stage)
  );
  return new;
end;
$$;
;
