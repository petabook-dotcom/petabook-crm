"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { bulkAddTagAction, bulkUpdateStageAction } from "@/app/pipeline/actions";
import { PipelineBoard } from "@/components/pipeline-board";
import { ProspectDetailsModal } from "@/components/prospect-details-modal";
import { ProspectFormDrawer } from "@/components/prospect-form-drawer";
import { ProspectTable } from "@/components/prospect-table";
import { PlusIcon } from "@/components/icons";
import { useToast } from "@/components/toast";
import { STAGES, STAGE_META, type FunnelStage, type Prospect } from "@/types/crm";

type PipelineView = "table" | "board";

export function PipelineWorkspace({
  prospects,
  initialProspectId,
}: {
  prospects: Prospect[];
  initialProspectId?: string | null;
}) {
  const [localProspects, setLocalProspects] = useState(prospects);
  const [stage, setStage] = useState<FunnelStage | "all">("all");
  const [view, setView] = useState<PipelineView>("table");

  useEffect(() => {
    const stored = window.localStorage.getItem("pipeline-view");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "board" || stored === "table") setView(stored);
  }, []);

  function switchView(next: PipelineView) {
    setView(next);
    window.localStorage.setItem("pipeline-view", next);
  }

  const [segment, setSegment] = useState("all");
  const [region, setRegion] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(
    initialProspectId ? prospects.find((p) => p.id === initialProspectId) ?? null : null,
  );
  const [formProspect, setFormProspect] = useState<Prospect | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [, startBulkTransition] = useTransition();
  const { showToast } = useToast();

  const segments = useMemo(() => [...new Set(localProspects.map((p) => p.segment))].sort(), [localProspects]);
  const regions = useMemo(() => [...new Set(localProspects.map((p) => p.region))].sort(), [localProspects]);

  const filteredProspects = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("pt");
    return localProspects.filter((prospect) => {
      const searchable = [prospect.business_name, prospect.city, prospect.email, prospect.phone, prospect.website, prospect.notes]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt");
      return (
        (stage === "all" || prospect.funnel_stage === stage) &&
        (segment === "all" || prospect.segment === segment) &&
        (region === "all" || prospect.region === region) &&
        (!search || searchable.includes(search))
      );
    });
  }, [localProspects, query, region, segment, stage]);

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Vista do pipeline" className="inline-flex rounded-lg border border-border bg-surface p-0.5 shadow-sm">
          {(["table", "board"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => switchView(option)}
              aria-pressed={view === option}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
                view === option ? "bg-neutral-900 text-white shadow-sm" : "text-neutral-600 hover:bg-neutral-100 hover:text-foreground"
              }`}
            >
              {option === "table" ? "Tabela" : "Quadro"}
            </button>
          ))}
        </div>
      </div>

      {view === "table" && (
        <div className="mb-4 rounded-xl border border-border bg-surface p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-4 px-0.5">
            <div>
              <p className="text-sm font-semibold text-foreground">Estágios do pipeline</p>
              <p className="mt-0.5 text-xs text-muted">Seleciona um estágio para focar a lista</p>
            </div>
            {stage !== "all" && (
              <button
                type="button"
                onClick={() => setStage("all")}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                Mostrar todos
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setStage("all")}
              aria-pressed={stage === "all"}
              className={`group relative min-w-28 shrink-0 overflow-hidden rounded-lg border px-3 py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
                stage === "all"
                  ? "border-neutral-800 bg-neutral-900 text-white shadow-md ring-4 ring-neutral-900/10"
                  : "border-border bg-white text-neutral-700 hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md"
              }`}
            >
              <span className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium">Todos</span>
                <span aria-hidden className={`text-sm transition-transform duration-200 group-hover:translate-x-0.5 ${stage === "all" ? "text-white/70" : "text-neutral-300"}`}>
                  →
                </span>
              </span>
              <span className="mt-1 block text-lg font-semibold leading-none">{localProspects.length}</span>
            </button>

            {STAGES.map((item) => {
              const count = localProspects.filter((p) => p.funnel_stage === item).length;
              if (count === 0) return null;
              const isActive = stage === item;
              const meta = STAGE_META[item];

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStage(isActive ? "all" : item)}
                  aria-pressed={isActive}
                  className={`group relative min-w-36 shrink-0 overflow-hidden rounded-lg border px-3 py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
                    isActive ? `${meta.active} shadow-md ring-4` : `border-border bg-white text-neutral-700 hover:-translate-y-0.5 hover:shadow-md ${meta.hover}`
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden className={`size-2 shrink-0 rounded-full ${meta.dot} transition-transform duration-200 group-hover:scale-125`} />
                      <span className="truncate text-xs font-medium">{meta.label}</span>
                    </span>
                    <span aria-hidden className={`text-sm transition-all duration-200 group-hover:translate-x-0.5 ${isActive ? "opacity-70" : "text-neutral-300 group-hover:text-neutral-500"}`}>
                      {isActive ? "✓" : "→"}
                    </span>
                  </span>
                  <span className="mt-1 block text-lg font-semibold leading-none">{count}</span>
                  <span className="mt-1 block text-[10px] text-current opacity-55">
                    {Math.round((count / localProspects.length) * 100)}% do pipeline
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-4 grid gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_200px_200px_auto]">
        <label>
          <span className="sr-only">Pesquisar prospects</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar negócio, cidade, email, telefone, site ou notas…"
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/10"
          />
        </label>
        <FilterSelect label="Segmento" value={segment} onChange={setSegment} options={segments} />
        <FilterSelect label="Região" value={region} onChange={setRegion} options={regions} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setStage("all");
              setSegment("all");
              setRegion("all");
              setQuery("");
            }}
            className="h-10 rounded-lg px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Limpar filtros
          </button>
          <button
            type="button"
            onClick={() => {
              setFormProspect(null);
              setFormOpen(true);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <PlusIcon className="size-4" />
            Novo prospect
          </button>
        </div>
      </div>

      {view === "table" && selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
          <p className="text-sm font-medium text-accent">{selectedIds.size} selecionado(s)</p>
          <select
            defaultValue=""
            onChange={(event) => {
              const nextStage = event.target.value as FunnelStage;
              if (!nextStage) return;
              const ids = [...selectedIds];
              startBulkTransition(async () => {
                const result = await bulkUpdateStageAction(ids, nextStage);
                if (result.error) {
                  showToast(result.error, "error");
                  return;
                }
                setLocalProspects((current) =>
                  current.map((p) => (ids.includes(p.id) ? { ...p, funnel_stage: nextStage } : p)),
                );
                showToast(`${result.count} prospect(s) movido(s) para ${STAGE_META[nextStage].label}`);
                clearSelection();
              });
            }}
            className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-accent"
          >
            <option value="">Mover para estágio…</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_META[s].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              const tag = window.prompt("Tag a adicionar:");
              if (!tag) return;
              const ids = [...selectedIds];
              startBulkTransition(async () => {
                const result = await bulkAddTagAction(ids, tag);
                if (result.error) {
                  showToast(result.error, "error");
                  return;
                }
                showToast(`Tag adicionada a ${result.count} prospect(s)`);
                window.location.reload();
              });
            }}
            className="h-9 rounded-lg border border-border bg-white px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Adicionar tag
          </button>
          <button type="button" onClick={clearSelection} className="h-9 rounded-lg px-3 text-sm text-neutral-500 hover:bg-neutral-100">
            Limpar seleção
          </button>
        </div>
      )}

      {view === "table" ? (
        <ProspectTable
          prospects={filteredProspects}
          selectedIds={selectedIds}
          onToggleSelected={toggleSelected}
          onSelectProspect={setSelectedProspect}
        />
      ) : (
        <PipelineBoard
          prospects={filteredProspects}
          stages={STAGES}
          onSelectProspect={setSelectedProspect}
          onProspectUpdated={(updated) => {
            setLocalProspects((current) => current.map((p) => (p.id === updated.id ? updated : p)));
            if (selectedProspect?.id === updated.id) setSelectedProspect(updated);
          }}
        />
      )}
      <p className="mt-3 text-xs text-muted">
        A mostrar {filteredProspects.length} de {localProspects.length} prospects · alterações guardadas no Supabase
      </p>

      {selectedProspect && (
        <ProspectDetailsModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onProspectUpdated={(updated) => {
            setLocalProspects((current) => current.map((p) => (p.id === selectedProspect.id ? updated : p)));
            setSelectedProspect(updated);
          }}
          onEdit={() => {
            setFormProspect(selectedProspect);
            setFormOpen(true);
          }}
          onProspectDeleted={() => {
            setLocalProspects((current) => current.filter((p) => p.id !== selectedProspect.id));
            setSelectedProspect(null);
            showToast(`${selectedProspect.business_name} removido`);
          }}
        />
      )}
      {formOpen && (
        <ProspectFormDrawer
          prospect={formProspect}
          onClose={() => setFormOpen(false)}
          onSaved={(saved) => {
            setLocalProspects((current) => {
              const exists = current.some((p) => p.id === saved.id);
              return exists ? current.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...current];
            });
            if (selectedProspect?.id === saved.id) setSelectedProspect(saved);
            setFormOpen(false);
            showToast(formProspect ? "Prospect atualizado" : `${saved.business_name} adicionado ao pipeline`);
          }}
        />
      )}
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-border bg-white px-3 pr-8 text-sm text-neutral-700 outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
      >
        <option value="all">Todos · {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-3 top-2.5 text-xs text-muted">
        ▾
      </span>
    </label>
  );
}
