import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { QueryResult } from "@/types/crm";

export interface ContactTemplate {
  id: string;
  title: string;
  channel: "email" | "whatsapp" | "call";
  subject: string | null;
  body: string;
  category: string | null;
  status: string | null;
  storage_path: string;
  created_at: string;
  updated_at: string;
}

export interface BattlesheetDocument {
  title: string;
  source: string | null;
  body: string;
  storage_path: string;
  updated_at: string;
}

// Templates and the battlesheet live in Supabase Storage, not a table — a
// non-developer edits outreach copy by uploading a Markdown file, no
// deploy required. Read with the service-role client so the bucket can
// stay private.
export async function getContactTemplates(): Promise<QueryResult<ContactTemplate[]>> {
  const storage = getSupabaseAdminClient().storage.from("outreach-templates");
  const { data: files, error: listError } = await storage.list("", {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (listError) return { data: null, error: listError.message };

  const markdownFiles = (files ?? []).filter((file) => file.name.endsWith(".md"));
  try {
    const templates = await Promise.all(
      markdownFiles.map(async (file): Promise<ContactTemplate> => {
        const { data, error } = await storage.download(file.name);
        if (error) throw new Error(`Não foi possível ler ${file.name}: ${error.message}`);

        const parsed = parseTemplateMarkdown(await data.text());
        return {
          id: file.id ?? file.name,
          title: parsed.metadata.title ?? titleFromFilename(file.name),
          channel: (parsed.metadata.channel as ContactTemplate["channel"]) ?? "email",
          subject: parsed.metadata.subject ?? null,
          body: parsed.body,
          category: parsed.metadata.category ?? null,
          status: parsed.metadata.status ?? null,
          storage_path: file.name,
          created_at: file.created_at ?? new Date(0).toISOString(),
          updated_at: file.updated_at ?? file.created_at ?? new Date(0).toISOString(),
        };
      }),
    );

    return { data: templates, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : "Não foi possível carregar os templates." };
  }
}

export async function getBattlesheet(): Promise<QueryResult<BattlesheetDocument>> {
  const storage = getSupabaseAdminClient().storage.from("battlesheet");
  const storagePath = "battlesheet-petabook.md";
  const [{ data: file, error: downloadError }, { data: files, error: listError }] = await Promise.all([
    storage.download(storagePath),
    storage.list("", { limit: 100 }),
  ]);

  if (downloadError) return { data: null, error: downloadError.message };
  if (listError) return { data: null, error: listError.message };

  const parsed = parseTemplateMarkdown(await file.text());
  const metadata = (files ?? []).find((item) => item.name === storagePath);

  return {
    data: {
      title: parsed.metadata.title ?? "Battlesheet de vendas",
      source: parsed.metadata.source ?? null,
      body: parsed.body,
      storage_path: storagePath,
      updated_at: metadata?.updated_at ?? metadata?.created_at ?? new Date(0).toISOString(),
    },
    error: null,
  };
}

function parseTemplateMarkdown(markdown: string) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { metadata: {} as Record<string, string>, body: markdown.trim() };

  const metadata = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => {
        const separator = line.indexOf(":");
        if (separator === -1) return null;
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value] as const;
      })
      .filter((entry): entry is readonly [string, string] => entry !== null),
  );

  return { metadata, body: match[2].trim() };
}

function titleFromFilename(filename: string) {
  return filename
    .replace(/\.md$/i, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
