"use server";

import { revalidatePath } from "next/cache";
import { requireCrmAccess } from "@/lib/access/server";
import { getProspectActivities, logActivity } from "@/lib/prospect-activities";
import { computeIdentityKey } from "@/lib/prospects";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { updateProspectFunnel } from "@/lib/queries";
import {
  LOGGABLE_ACTIVITY_TYPES,
  PREFERRED_CHANNELS,
  STAGES,
  type ActivityType,
  type FunnelStage,
  type Prospect,
  type ProspectActivity,
} from "@/types/crm";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Result<T> = { data: T; error: null } | { data: null; error: string };

function revalidateProspectViews() {
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

function pgErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "Já existe um prospect com este contacto (mesmo email, telefone ou site).";
  }
  if (error.code === "23503") {
    return "Este registo está associado a outros dados — remove-os primeiro.";
  }
  return error.message;
}

export async function updateProspectFunnelAction(
  prospectId: string,
  funnelStage: string,
): Promise<Result<Prospect>> {
  await requireCrmAccess();
  if (!UUID_PATTERN.test(prospectId)) return { data: null, error: "Identificador inválido." };
  if (!STAGES.includes(funnelStage as FunnelStage)) return { data: null, error: "Estágio inválido." };

  const result = await updateProspectFunnel(prospectId, funnelStage as FunnelStage);
  if (!result.data) return result;

  revalidateProspectViews();
  return result;
}

export interface ProspectFormState {
  error: string | null;
  prospect: Prospect | null;
}

export async function saveProspectAction(
  prospectId: string | null,
  _previousState: ProspectFormState,
  formData: FormData,
): Promise<ProspectFormState> {
  await requireCrmAccess();
  if (prospectId !== null && !UUID_PATTERN.test(prospectId)) {
    return { error: "Identificador inválido.", prospect: null };
  }

  const text = (name: string) => String(formData.get(name) ?? "").trim();
  const optional = (name: string) => text(name) || null;

  const businessName = text("business_name");
  const region = text("region") || "Desconhecido";
  const city = text("city") || "Desconhecido";
  const segment = text("segment") || "Por classificar";
  const funnelStage = text("funnel_stage") || "Prospect";
  const scoreRaw = text("prospect_score").replace(",", ".");
  const prospectScore = scoreRaw ? Number(scoreRaw) : null;
  const channel = text("preferred_channel");
  const lastContacted = text("last_contacted_at");
  const tags = text("tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!businessName) {
    return { error: "O nome do negócio é obrigatório.", prospect: null };
  }
  if (!STAGES.includes(funnelStage as FunnelStage)) {
    return { error: "Estágio inválido.", prospect: null };
  }
  if (prospectScore !== null && (!Number.isFinite(prospectScore) || prospectScore < 0 || prospectScore > 9999)) {
    return { error: "A pontuação deve ser um número entre 0 e 9999.", prospect: null };
  }
  if (channel && !PREFERRED_CHANNELS.includes(channel as (typeof PREFERRED_CHANNELS)[number])) {
    return { error: "Canal preferido inválido.", prospect: null };
  }

  const email = optional("email");
  const phone = optional("phone");
  const website = optional("website");
  const values = {
    business_name: businessName,
    legal_name: optional("legal_name"),
    region,
    sub_region: optional("sub_region"),
    city,
    address: optional("address"),
    email,
    phone,
    website,
    instagram_url: optional("instagram_url"),
    facebook_url: optional("facebook_url"),
    google_maps_url: optional("google_maps_url"),
    source: optional("source"),
    funnel_stage: funnelStage,
    segment,
    notes: optional("notes"),
    prospect_score: prospectScore,
    tags,
    last_contacted_at: lastContacted || null,
    preferred_channel: channel || null,
    identity_key: computeIdentityKey({ email, phone, website, business_name: businessName, city }),
  };

  const supabase = getSupabaseAdminClient();
  const query = prospectId
    ? supabase.from("prospects").update(values).eq("id", prospectId)
    : supabase.from("prospects").insert(values);
  const { data: prospect, error } = await query.select("*").maybeSingle();

  if (error) {
    return { error: pgErrorMessage(error), prospect: null };
  }
  if (!prospect) return { error: "Prospect já não existe.", prospect: null };

  revalidateProspectViews();
  return { error: null, prospect: prospect as Prospect };
}

export async function getProspectActivitiesAction(
  prospectId: string,
): Promise<{ data: ProspectActivity[] | null; error: string | null }> {
  await requireCrmAccess();
  if (!UUID_PATTERN.test(prospectId)) return { data: null, error: "Identificador inválido." };
  return getProspectActivities(prospectId);
}

export async function logActivityAction(
  prospectId: string,
  type: string,
  body: string,
): Promise<{ data: ProspectActivity | null; error: string | null }> {
  await requireCrmAccess();
  if (!UUID_PATTERN.test(prospectId)) return { data: null, error: "Identificador inválido." };
  if (!LOGGABLE_ACTIVITY_TYPES.includes(type as (typeof LOGGABLE_ACTIVITY_TYPES)[number])) {
    return { data: null, error: "Tipo de atividade inválido." };
  }
  const trimmed = body.trim();
  if (!trimmed) return { data: null, error: "Escreve uma nota curta sobre o que aconteceu." };

  const result = await logActivity(prospectId, type as ActivityType, trimmed);
  if (!result.data) return result;

  revalidateProspectViews();
  return result;
}

export async function setNextActionAction(
  prospectId: string,
  nextActionAt: string,
  note: string,
): Promise<{ data: Prospect | null; error: string | null }> {
  await requireCrmAccess();
  if (!UUID_PATTERN.test(prospectId)) return { data: null, error: "Identificador inválido." };
  if (nextActionAt && !/^\d{4}-\d{2}-\d{2}$/.test(nextActionAt)) {
    return { data: null, error: "Data inválida." };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("prospects")
    .update({ next_action_at: nextActionAt || null, next_action_note: note.trim() || null })
    .eq("id", prospectId)
    .select("*")
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Prospect já não existe." };

  revalidateProspectViews();
  return { data: data as Prospect, error: null };
}

export async function deleteProspectAction(prospectId: string): Promise<{ error: string | null }> {
  await requireCrmAccess();
  if (!UUID_PATTERN.test(prospectId)) return { error: "Identificador inválido." };

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("prospects").delete().eq("id", prospectId);

  if (error) return { error: pgErrorMessage(error) };

  revalidateProspectViews();
  return { error: null };
}

// Converting hotels at volume needs multi-select actions — neither
// reference CRM ever got these.
export async function bulkUpdateStageAction(
  prospectIds: string[],
  funnelStage: string,
): Promise<{ error: string | null; count: number }> {
  await requireCrmAccess();
  const ids = prospectIds.filter((id) => UUID_PATTERN.test(id));
  if (!ids.length) return { error: "Nenhum prospect selecionado.", count: 0 };
  if (!STAGES.includes(funnelStage as FunnelStage)) return { error: "Estágio inválido.", count: 0 };

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("prospects")
    .update({ funnel_stage: funnelStage })
    .in("id", ids)
    .select("id");

  if (error) return { error: pgErrorMessage(error), count: 0 };

  revalidateProspectViews();
  return { error: null, count: data?.length ?? 0 };
}

export async function bulkAddTagAction(
  prospectIds: string[],
  tag: string,
): Promise<{ error: string | null; count: number }> {
  await requireCrmAccess();
  const ids = prospectIds.filter((id) => UUID_PATTERN.test(id));
  const trimmedTag = tag.trim();
  if (!ids.length) return { error: "Nenhum prospect selecionado.", count: 0 };
  if (!trimmedTag) return { error: "Introduz uma tag.", count: 0 };

  const supabase = getSupabaseAdminClient();
  const { data: rows, error: readError } = await supabase
    .from("prospects")
    .select("id, tags")
    .in("id", ids);
  if (readError) return { error: readError.message, count: 0 };

  await Promise.all(
    (rows ?? []).map((row: { id: string; tags: string[] }) =>
      row.tags.includes(trimmedTag)
        ? Promise.resolve()
        : supabase
            .from("prospects")
            .update({ tags: [...row.tags, trimmedTag] })
            .eq("id", row.id),
    ),
  );

  revalidateProspectViews();
  return { error: null, count: rows?.length ?? 0 };
}

// --- Contacts (fixes the flat contact_name/email scar in both reference
// CRMs — a dog hotel has an owner, a manager, and a front-desk email) ---

export interface ContactFormState {
  error: string | null;
  contact: import("@/types/crm").ProspectContact | null;
}

export async function saveContactAction(
  prospectId: string,
  contactId: string | null,
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  await requireCrmAccess();
  if (!UUID_PATTERN.test(prospectId)) return { error: "Identificador inválido.", contact: null };
  if (contactId !== null && !UUID_PATTERN.test(contactId)) {
    return { error: "Identificador inválido.", contact: null };
  }

  const text = (name: string) => String(formData.get(name) ?? "").trim();
  const optional = (name: string) => text(name) || null;
  const name = text("name");
  const isPrimary = formData.get("is_primary") === "on";

  if (!name) return { error: "O nome é obrigatório.", contact: null };

  const values = {
    prospect_id: prospectId,
    name,
    role: optional("role"),
    email: optional("email"),
    phone: optional("phone"),
    whatsapp: optional("whatsapp"),
    linkedin_url: optional("linkedin_url"),
    is_primary: isPrimary,
    notes: optional("notes"),
  };

  const supabase = getSupabaseAdminClient();

  // Demote any existing primary first so the "one primary per prospect"
  // unique index never sees two true rows at once.
  if (isPrimary) {
    await supabase
      .from("prospect_contacts")
      .update({ is_primary: false })
      .eq("prospect_id", prospectId)
      .neq("id", contactId ?? "00000000-0000-0000-0000-000000000000");
  }

  const query = contactId
    ? supabase.from("prospect_contacts").update(values).eq("id", contactId)
    : supabase.from("prospect_contacts").insert(values);
  const { data: contact, error } = await query.select("*").maybeSingle();

  if (error) return { error: pgErrorMessage(error), contact: null };
  if (!contact) return { error: "Contacto já não existe.", contact: null };

  revalidateProspectViews();
  return { error: null, contact };
}

export async function deleteContactAction(contactId: string): Promise<{ error: string | null }> {
  await requireCrmAccess();
  if (!UUID_PATTERN.test(contactId)) return { error: "Identificador inválido." };

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("prospect_contacts").delete().eq("id", contactId);

  if (error) return { error: pgErrorMessage(error) };
  revalidateProspectViews();
  return { error: null };
}

export async function getProspectContactsAction(
  prospectId: string,
): Promise<{ data: import("@/types/crm").ProspectContact[] | null; error: string | null }> {
  await requireCrmAccess();
  if (!UUID_PATTERN.test(prospectId)) return { data: null, error: "Identificador inválido." };
  const { getProspectContacts } = await import("@/lib/contacts");
  return getProspectContacts(prospectId);
}
