"use client";

import { EyeIcon } from "@/components/icons";
import { isOverdue } from "@/components/prospect-activity";
import { STAGE_META, type Prospect } from "@/types/crm";

function formatDate(value: string | null) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function ProspectTable({
  prospects,
  selectedIds,
  onToggleSelected,
  onSelectProspect,
}: {
  prospects: Prospect[];
  selectedIds: Set<string>;
  onToggleSelected: (id: string, checked: boolean) => void;
  onSelectProspect: (prospect: Prospect) => void;
}) {
  if (prospects.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-14 text-center shadow-sm">
        <p className="font-medium text-neutral-900">Nenhum prospect corresponde a estes filtros</p>
        <p className="mt-1 text-sm text-muted">Remove um filtro ou tenta uma pesquisa mais ampla.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
          <thead className="border-b border-border bg-neutral-50/80 text-xs font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="w-10 px-4 py-3.5" />
              <th className="px-5 py-3.5">Negócio & contacto</th>
              <th className="px-4 py-3.5">Estágio</th>
              <th className="px-4 py-3.5">Próxima ação</th>
              <th className="px-4 py-3.5">Último contacto</th>
              <th className="px-4 py-3.5">Segmento</th>
              <th className="px-4 py-3.5">Localização</th>
              <th className="px-4 py-3.5 text-center">Score</th>
              <th className="px-5 py-3.5">Canal</th>
              <th className="px-5 py-3.5 text-right">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {prospects.map((prospect) => {
              const meta = STAGE_META[prospect.funnel_stage];
              return (
                <tr
                  key={prospect.id}
                  onClick={() => onSelectProspect(prospect)}
                  className="cursor-pointer align-top transition-colors hover:bg-neutral-50/70"
                >
                  <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(prospect.id)}
                      onChange={(event) => onToggleSelected(prospect.id, event.target.checked)}
                      aria-label={`Selecionar ${prospect.business_name}`}
                      className="size-4 rounded border-border text-accent focus:ring-accent/40"
                    />
                  </td>
                  <td className="max-w-[320px] px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onSelectProspect(prospect)}
                      className="block max-w-full truncate text-left font-medium text-neutral-950 underline-offset-2 hover:text-accent hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      aria-label={`Abrir detalhes de ${prospect.business_name}`}
                    >
                      {prospect.business_name}
                    </button>
                    <p className="mt-1 truncate text-xs text-neutral-600">{prospect.city}</p>
                    <div className="mt-2 flex flex-col gap-1 text-xs">
                      {prospect.email ? (
                        <a
                          href={`mailto:${prospect.email}`}
                          onClick={(event) => event.stopPropagation()}
                          className="w-fit max-w-full truncate text-accent underline decoration-accent/20 underline-offset-2 hover:decoration-accent"
                          title={prospect.email}
                        >
                          <span aria-hidden>✉</span> {prospect.email}
                        </a>
                      ) : (
                        <span className="text-neutral-400">✉ Sem email</span>
                      )}
                      {prospect.phone ? (
                        <a
                          href={`tel:${prospect.phone}`}
                          onClick={(event) => event.stopPropagation()}
                          className="w-fit max-w-full truncate font-medium text-neutral-700 underline decoration-neutral-400/30 underline-offset-2 hover:text-accent hover:decoration-accent"
                          title={prospect.phone}
                        >
                          <span aria-hidden>☎</span> {prospect.phone}
                        </a>
                      ) : (
                        <span className="text-neutral-400">☎ Sem telefone</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.badge}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="max-w-[220px] px-4 py-4">
                    {prospect.next_action_at ? (
                      <span
                        className={`inline-flex max-w-full items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                          isOverdue(prospect) ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"
                        }`}
                        title={prospect.next_action_note ?? undefined}
                      >
                        {isOverdue(prospect) && (
                          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-amber-500" />
                        )}
                        <span className="truncate">
                          {formatDate(prospect.next_action_at)}
                          {prospect.next_action_note ? ` · ${prospect.next_action_note}` : ""}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                        {meta.nextAction}
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-4 ${prospect.last_contacted_at ? "text-neutral-600" : "font-medium text-amber-700"}`}>
                    {formatDate(prospect.last_contacted_at)}
                  </td>
                  <td className="px-4 py-4 text-neutral-600">{prospect.segment}</td>
                  <td className="max-w-[210px] px-4 py-4 text-neutral-600">
                    <span className="line-clamp-2">{prospect.city}</span>
                  </td>
                  <td className="px-4 py-4 text-center font-mono text-xs font-semibold">
                    {prospect.prospect_score?.toLocaleString("pt-PT") ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{prospect.preferred_channel ?? "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectProspect(prospect);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      aria-label={`Ver detalhes de ${prospect.business_name}`}
                    >
                      <EyeIcon className="size-4" />
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
