alter table public.prospects drop constraint if exists prospects_funnel_stage_check;
alter table public.prospects add constraint prospects_funnel_stage_check
  check (funnel_stage in ('Prospect', 'Contacted', 'Called', 'Engaged', 'Meeting', 'Proposal', 'Onboarding', 'Lost', 'On Hold'));
