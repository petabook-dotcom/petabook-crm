import type { Metadata } from "next";
import { connection } from "next/server";
import { DataError } from "@/components/data-error";
import { PageHeader } from "@/components/page-header";
import { TemplateCard } from "@/components/template-card";
import { getContactTemplates } from "@/lib/content";

export const metadata: Metadata = { title: "Templates de contacto" };

export default async function TemplatesPage() {
  await connection();
  const result = await getContactTemplates();

  return (
    <>
      <PageHeader
        eyebrow="Outreach"
        title="Templates de contacto"
        description="Mensagens reutilizáveis para outreach consistente por email ou WhatsApp."
      />
      {!result.data ? (
        <DataError title="Templates indisponíveis" message={result.error} />
      ) : result.data.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-14 text-center shadow-sm">
          <p className="font-medium">Ainda sem templates</p>
          <p className="mt-1 text-sm text-muted">
            Adiciona ficheiros Markdown ao bucket de Storage &quot;outreach-templates&quot; para aparecerem aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.data.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </>
  );
}
