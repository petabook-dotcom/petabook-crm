// Single source of truth for the prospect-acquisition funnel. One tuple
// drives the TS union, the <select> options, the kanban columns, the stage
// filter strip, the dashboard funnel chart, and server-side validation.
export const STAGES = [
  "Prospect",
  "Contacted",
  "Engaged",
  "Meeting",
  "Proposal",
  "Onboarding",
  "Lost",
  "On Hold",
] as const;

export type FunnelStage = (typeof STAGES)[number];

// Stages a salesperson is still actively working. Used for follow-up /
// stale-prospect queries and to suppress "overdue" noise on closed rows.
export const ACTIVE_STAGES: FunnelStage[] = [
  "Prospect",
  "Contacted",
  "Engaged",
  "Meeting",
  "Proposal",
];

export const CLOSED_STAGES: FunnelStage[] = ["Onboarding", "Lost", "On Hold"];

export const ACTIVITY_TYPES = [
  "note",
  "email",
  "call",
  "whatsapp",
  "meeting",
  "visit",
  "stage_change",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// Manual activity logging excludes "stage_change" (written only by the DB
// trigger) so the timeline can't be forged out of sync with the real stage.
export const LOGGABLE_ACTIVITY_TYPES = ACTIVITY_TYPES.filter(
  (type) => type !== "stage_change",
) as Exclude<ActivityType, "stage_change">[];

export const PREFERRED_CHANNELS = ["Email", "Telefone", "WhatsApp"] as const;
export type PreferredChannel = (typeof PREFERRED_CHANNELS)[number];

// One record per stage carrying every visual + copy concern (color, badge,
// kanban column background, Portuguese label, and the free next-best-action
// suggestion). Both reference CRMs duplicated this across 3-4 files; here it
// lives once and everything else imports from it.
export const STAGE_META: Record<
  FunnelStage,
  {
    label: string;
    dot: string;
    badge: string;
    active: string;
    hover: string;
    column: string;
    nextAction: string;
  }
> = {
  Prospect: {
    label: "Prospect",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 ring-blue-600/20",
    active: "border-blue-300 bg-blue-50 text-blue-950 ring-blue-500/15",
    hover: "hover:border-blue-200 hover:bg-blue-50/70",
    column: "border-blue-200 bg-blue-50/40",
    nextAction: "Contactar",
  },
  Contacted: {
    label: "Contactado",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-800 ring-amber-600/20",
    active: "border-amber-300 bg-amber-50 text-amber-950 ring-amber-500/15",
    hover: "hover:border-amber-200 hover:bg-amber-50/70",
    column: "border-amber-200 bg-amber-50/40",
    nextAction: "Fazer follow-up",
  },
  Engaged: {
    label: "Interessado",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 ring-violet-600/20",
    active: "border-violet-300 bg-violet-50 text-violet-950 ring-violet-500/15",
    hover: "hover:border-violet-200 hover:bg-violet-50/70",
    column: "border-violet-200 bg-violet-50/40",
    nextAction: "Qualificar interesse",
  },
  Meeting: {
    label: "Reunião",
    dot: "bg-cyan-500",
    badge: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
    active: "border-cyan-300 bg-cyan-50 text-cyan-950 ring-cyan-500/15",
    hover: "hover:border-cyan-200 hover:bg-cyan-50/70",
    column: "border-cyan-200 bg-cyan-50/40",
    nextAction: "Marcar reunião",
  },
  Proposal: {
    label: "Proposta",
    dot: "bg-fuchsia-500",
    badge: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20",
    active: "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950 ring-fuchsia-500/15",
    hover: "hover:border-fuchsia-200 hover:bg-fuchsia-50/70",
    column: "border-fuchsia-200 bg-fuchsia-50/40",
    nextAction: "Enviar proposta",
  },
  Onboarding: {
    label: "Onboarding",
    dot: "bg-indigo-500",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    active: "border-indigo-300 bg-indigo-50 text-indigo-950 ring-indigo-500/15",
    hover: "hover:border-indigo-200 hover:bg-indigo-50/70",
    column: "border-indigo-200 bg-indigo-50/40",
    nextAction: "Concluído",
  },
  Lost: {
    label: "Perdido",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    active: "border-red-300 bg-red-50 text-red-950 ring-red-500/15",
    hover: "hover:border-red-200 hover:bg-red-50/70",
    column: "border-red-200 bg-red-50/40",
    nextAction: "Sem ação",
  },
  "On Hold": {
    label: "Em espera",
    dot: "bg-neutral-500",
    badge: "bg-neutral-100 text-neutral-700 ring-neutral-500/20",
    active: "border-neutral-400 bg-neutral-100 text-neutral-950 ring-neutral-500/15",
    hover: "hover:border-neutral-300 hover:bg-neutral-100/80",
    column: "border-neutral-200 bg-neutral-100/50",
    nextAction: "Rever mais tarde",
  },
};

export interface Prospect {
  id: string;
  identity_key: string | null;
  business_name: string;
  legal_name: string | null;
  region: string;
  sub_region: string | null;
  city: string;
  address: string | null;
  country: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  google_maps_url: string | null;
  source: string | null;
  funnel_stage: FunnelStage;
  segment: string;
  notes: string | null;
  prospect_score: number | null;
  tags: string[];
  last_contacted_at: string | null;
  preferred_channel: PreferredChannel | null;
  next_action_at: string | null;
  next_action_note: string | null;
  import_source: string | null;
  import_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProspectContact {
  id: string;
  prospect_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedin_url: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProspectActivity {
  id: string;
  prospect_id: string;
  type: ActivityType;
  body: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

export interface OutreachTouch {
  id: string;
  prospect_id: string;
  contact_id: string | null;
  channel: string;
  template_slug: string | null;
  sequence_step: number;
  thread_id: string | null;
  subject: string | null;
  body: string | null;
  sent_at: string | null;
  replied_at: string | null;
  bounced_at: string | null;
  created_at: string;
}

export type QueryResult<T> = { data: T; error: null } | { data: null; error: string };
