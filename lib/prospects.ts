import "server-only";

import { createHash } from "node:crypto";

// Mirrors public.compute_identity_key in the database (supabase/migrations)
// so prospects created in the app stay dedup-visible to anything that
// writes prospects directly (imports, future n8n workflows). Precedence:
// email -> phone (>=7 digits) -> website host -> unaccent(name)|city.
function normalized(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function websiteHost(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, "")
    .split("/")[0];
}

export function computeIdentityKey(input: {
  email: string | null;
  phone: string | null;
  website: string | null;
  business_name: string;
  city: string;
}) {
  const email = (input.email ?? "").trim().toLowerCase();
  const phone = (input.phone ?? "").replace(/\D/g, "");
  const host = websiteHost(input.website);
  const nameCity = `${normalized(input.business_name)}|${normalized(input.city)}`;

  const identity = email || (phone.length >= 7 ? phone : "") || host || nameCity;
  return createHash("sha256").update(identity).digest("hex");
}
