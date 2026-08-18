import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { ProspectContact, QueryResult } from "@/types/crm";

export async function getProspectContacts(prospectId: string): Promise<QueryResult<ProspectContact[]>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("prospect_contacts")
    .select("*")
    .eq("prospect_id", prospectId)
    .order("is_primary", { ascending: false })
    .order("created_at");

  if (error) return { data: null, error: error.message };
  return { data: data as ProspectContact[], error: null };
}
