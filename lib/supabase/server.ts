import "server-only";

import { createClient } from "@supabase/supabase-js";
import { dedicatedProjectUrl } from "@/lib/supabase/config";

// The <any> Database generic keeps .select()/.insert()/.update() permissive
// (matching the untyped style both reference CRMs use) — supabase-js 2.112
// otherwise infers `never` row types for an untyped createClient() call.
let adminClient: ReturnType<typeof createClient<any>> | undefined;

/**
 * The CRM's only data client. It uses the dedicated CRM project from trusted
 * server code and is never imported by a Client Component.
 */
export function getSupabaseAdminClient() {
  if (!adminClient) {
    adminClient = createClient<any>(
      dedicatedProjectUrl(),
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? (() => { throw new Error("SUPABASE_SERVICE_ROLE_KEY must be configured."); })(),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return adminClient;
}
