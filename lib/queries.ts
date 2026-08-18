import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { FunnelStage, Prospect, QueryResult } from "@/types/crm";

export async function getProspects(): Promise<QueryResult<Prospect[]>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .order("prospect_score", { ascending: false, nullsFirst: false })
    .order("business_name");

  if (error) return { data: null, error: error.message };
  return { data: data as Prospect[], error: null };
}

export async function getProspect(id: string): Promise<QueryResult<Prospect>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("prospects").select("*").eq("id", id).maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Prospect não encontrado." };
  return { data: data as Prospect, error: null };
}

export async function updateProspectFunnel(
  prospectId: string,
  funnelStage: FunnelStage,
): Promise<QueryResult<Prospect>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("prospects")
    .update({ funnel_stage: funnelStage })
    .eq("id", prospectId)
    .select("*")
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Prospect já não existe." };
  return { data: data as Prospect, error: null };
}
