import type { Metadata } from "next";
import { connection } from "next/server";
import { BattlesheetContent } from "@/components/battlesheet-content";
import { DataError } from "@/components/data-error";
import { PageHeader } from "@/components/page-header";
import { getBattlesheet } from "@/lib/content";

export const metadata: Metadata = { title: "Battlesheet" };

export default async function BattlesheetPage() {
  await connection();
  const result = await getBattlesheet();

  return (
    <>
      <PageHeader
        eyebrow="Playbook interno"
        title={result.data?.title ?? "Battlesheet de vendas"}
        description="Contexto estratégico de vendas, carregado do bucket privado de Storage."
      />

      {result.data ? (
        <>
          <article className="rounded-xl border border-border bg-surface px-5 py-7 shadow-sm sm:px-8 sm:py-9">
            <BattlesheetContent markdown={result.data.body} />
          </article>
          <p className="mt-3 text-xs text-muted">
            {result.data.storage_path} · Atualizado{" "}
            {new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short", year: "numeric" }).format(
              new Date(result.data.updated_at),
            )}
          </p>
        </>
      ) : (
        <DataError title="Não foi possível carregar o battlesheet" message={result.error} />
      )}
    </>
  );
}
