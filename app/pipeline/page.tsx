import { connection } from "next/server";
import { DataError } from "@/components/data-error";
import { PageHeader } from "@/components/page-header";
import { PipelineWorkspace } from "@/components/pipeline-workspace";
import { getProspects } from "@/lib/queries";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ prospect?: string }>;
}) {
  await connection();
  const { prospect: initialProspectId } = await searchParams;

  const result = await getProspects();
  if (!result.data) {
    return <DataError title="Não foi possível carregar o pipeline" message={result.error} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Aquisição B2B"
        title="Pipeline"
        description="Prospects de hotéis caninos, do primeiro contacto até ao onboarding concluído."
      />
      <PipelineWorkspace prospects={result.data} initialProspectId={initialProspectId ?? null} />
    </>
  );
}
