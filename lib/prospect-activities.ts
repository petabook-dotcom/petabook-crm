import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { ACTIVE_STAGES, type ActivityType, type ProspectActivity, type QueryResult } from "@/types/crm";

export interface RecentActivity extends ProspectActivity {
  business_name: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function getProspectActivities(
  prospectId: string,
): Promise<QueryResult<ProspectActivity[]>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("prospect_activities")
    .select("*")
    .eq("prospect_id", prospectId)
    .order("occurred_at", { ascending: false })
    .limit(100);

  if (error) return { data: null, error: error.message };

  return { data: data as ProspectActivity[], error: null };
}

export async function getRecentActivities(limit = 10): Promise<QueryResult<RecentActivity[]>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("prospect_activities")
    .select("*, prospects(business_name)")
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) return { data: null, error: error.message };

  return {
    data: (data as (ProspectActivity & { prospects: { business_name: string } | null })[]).map(
      ({ prospects, ...activity }) => ({
        ...activity,
        business_name: prospects?.business_name ?? "Prospect",
      }),
    ),
    error: null,
  };
}

// last_contacted_at is kept honest by the bump_prospect_last_contacted DB
// trigger (supabase/migrations) rather than here, so every writer of
// prospect_activities is covered — not just this function.
export async function logActivity(
  prospectId: string,
  type: ActivityType,
  body: string | null,
  occurredAt?: string,
): Promise<QueryResult<ProspectActivity>> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("prospect_activities")
    .insert({
      prospect_id: prospectId,
      type,
      body,
      ...(occurredAt ? { occurred_at: occurredAt } : {}),
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as ProspectActivity, error: null };
}

export async function getFollowUps() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .lte("next_action_at", todayISO())
    .in("funnel_stage", ACTIVE_STAGES)
    .order("next_action_at");

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getStaleProspects(days = 14) {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .in("funnel_stage", ACTIVE_STAGES)
    .is("next_action_at", null)
    .or(`last_contacted_at.lte.${cutoff},last_contacted_at.is.null`)
    .order("prospect_score", { ascending: false, nullsFirst: false });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
