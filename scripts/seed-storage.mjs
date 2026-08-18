#!/usr/bin/env node
// Uploads the starter battlesheet + outreach template into Supabase
// Storage (private buckets created by the storage migration). Run after filling in
// SUPABASE_SERVICE_ROLE_KEY in .env.
// Usage: node scripts/seed-storage.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
}
loadEnv(".env");

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}
if (new URL(url).hostname !== "ubdwuzmvxxmfihtgxvmx.supabase.co") {
  console.error("SUPABASE_URL must point to the dedicated Petabook CRM project");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const uploads = [
  { bucket: "battlesheet", path: "battlesheet-petabook.md", file: "content/battlesheet-petabook.md" },
  { bucket: "outreach-templates", path: "first-touch-email.md", file: "content/first-touch-email.md" },
];

for (const { bucket, path, file } of uploads) {
  const body = readFileSync(file, "utf8");
  const { error } = await admin.storage.from(bucket).upload(path, body, {
    contentType: "text/markdown",
    upsert: true,
  });
  if (error) {
    console.error(`Failed to upload ${file} -> ${bucket}/${path}: ${error.message}`);
    process.exit(1);
  }
  console.log(`Uploaded ${file} -> ${bucket}/${path}`);
}
