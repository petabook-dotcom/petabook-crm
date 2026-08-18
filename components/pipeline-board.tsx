"use client";

import { useState, useTransition } from "react";
import { updateProspectFunnelAction } from "@/app/pipeline/actions";
import { isOverdue } from "@/components/prospect-activity";
import { useToast } from "@/components/toast";
import { STAGE_META, type FunnelStage, type Prospect } from "@/types/crm";

export function PipelineBoard({
  prospects,
  stages,
  onSelectProspect,
  onProspectUpdated,
}: {
  prospects: Prospect[];
  stages: readonly FunnelStage[];
  onSelectProspect: (prospect: Prospect) => void;
  onProspectUpdated: (prospect: Prospect) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<FunnelStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleDrop(stage: FunnelStage) {
    const prospect = prospects.find((item) => item.id === draggingId);
    setDropStage(null);
    setDraggingId(null);
    if (!prospect || prospect.funnel_stage === stage) return;

    const previous = prospect;
    onProspectUpdated({ ...prospect, funnel_stage: stage });
    setError(null);
    startTransition(async () => {
      const result = await updateProspectFunnelAction(prospect.id, stage);
      if (!result.data) {
        onProspectUpdated(previous);
        setError(result.error);
        showToast(`Não foi possível mover ${prospect.business_name}`, "error");
        return;
      }
      onProspectUpdated(result.data);
      showToast(
        stage === "Onboarding"
          ? `${prospect.business_name} concluiu o pipeline 🎉`
          : `${prospect.business_name} movido para ${STAGE_META[stage].label}`,
      );
    });
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-3 overflow-x-auto pb-3">
        {stages.map((stage) => {
          const stageProspects = prospects.filter((prospect) => prospect.funnel_stage === stage);
          const meta = STAGE_META[stage];
          const isDropTarget = dropStage === stage;

          return (
            <section
              key={stage}
              aria-label={`Coluna ${meta.label}`}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (dropStage !== stage) setDropStage(stage);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDropStage((current) => (current === stage ? null : current));
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(stage);
              }}
              className={`flex max-h-[72vh] w-72 shrink-0 flex-col rounded-xl border transition-colors ${
                isDropTarget ? `${meta.column} border-2 border-dashed` : "border-border bg-surface"
              }`}
            >
              <header className="flex items-center justify-between gap-2 px-3 py-3">
                <span className="flex items-center gap-2">
                  <span aria-hidden className={`size-2 rounded-full ${meta.dot}`} />
                  <span className="text-xs font-semibold text-neutral-800">{meta.label}</span>
                </span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-600">
                  {stageProspects.length}
                </span>
              </header>

              <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                {stageProspects.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-neutral-400">
                    Larga aqui um prospect
                  </p>
                )}
                {stageProspects.map((prospect) => (
                  <article
                    key={prospect.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      setDraggingId(prospect.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDropStage(null);
                    }}
                    onClick={() => onSelectProspect(prospect)}
                    className={`cursor-grab rounded-lg border border-border bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md active:cursor-grabbing ${
                      draggingId === prospect.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium text-neutral-950">
                        {prospect.business_name}
                      </p>
                      {prospect.prospect_score !== null && (
                        <span className="shrink-0 font-mono text-xs font-semibold text-neutral-500">
                          {prospect.prospect_score.toLocaleString("pt-PT")}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-neutral-600">{prospect.city}</p>
                    {(prospect.tags.length > 0 || isOverdue(prospect)) && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {isOverdue(prospect) && (
                          <span
                            className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                            title={prospect.next_action_note ?? "Follow-up em atraso"}
                          >
                            <span aria-hidden className="size-1.5 rounded-full bg-amber-500" />
                            Em atraso
                          </span>
                        )}
                        {prospect.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">
                            {tag}
                          </span>
                        ))}
                        {prospect.tags.length > 2 && (
                          <span className="text-[10px] text-neutral-400">+{prospect.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
