export const CRM_PROJECT_HOST = "ubdwuzmvxxmfihtgxvmx.supabase.co";

export function dedicatedProjectUrl(value = process.env.SUPABASE_URL) {
  if (!value) throw new Error("SUPABASE_URL must be configured.");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("SUPABASE_URL must be a valid URL.");
  }

  if (url.protocol !== "https:" || url.hostname !== CRM_PROJECT_HOST) {
    throw new Error(`SUPABASE_URL must point to the dedicated CRM project (${CRM_PROJECT_HOST}).`);
  }
  return url.origin;
}
