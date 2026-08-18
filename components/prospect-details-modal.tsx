"use client";

import { useState, useTransition } from "react";
import { deleteProspectAction, updateProspectFunnelAction } from "@/app/pipeline/actions";
import { Drawer } from "@/components/drawer";
import { ActivitySection, NextActionSection } from "@/components/prospect-activity";
import { CloseIcon } from "@/components/icons";
import { ProspectContacts } from "@/components/prospect-contacts";
import { STAGES, STAGE_META, type FunnelStage, type Prospect } from "@/types/crm";

export function ProspectDetailsModal({
  prospect,
  onClose,
  onProspectUpdated,
  onEdit,
  onProspectDeleted,
}: {
  prospect: Prospect;
  onClose: () => void;
  onProspectUpdated: (prospect: Prospect) => void;
  onEdit: () => void;
  onProspectDeleted: () => void;
}) {
  const [funnelStage, setFunnelStage] = useState<FunnelStage>(prospect.funnel_stage);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const meta = STAGE_META[funnelStage];

  return (
    <Drawer labelledBy="prospect-dialog-title" onClose={onClose}>
      <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-border bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
        <div className="min-w-0">
          <div className="mb-2">
            <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.badge}`}>
              {meta.label}
            </span>
          </div>
          <h2 id="prospect-dialog-title" className="truncate text-2xl font-semibold tracking-tight">
            {prospect.business_name}
          </h2>
          <p className="mt-1 text-sm text-muted">{prospect.city}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-neutral-700 hover:border-accent/40 hover:bg-accent/5 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="rounded-lg p-2 text-muted hover:bg-neutral-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Fechar detalhes"
          >
            <CloseIcon />
          </button>
        </div>
      </header>

      <div className="px-5 py-6 sm:px-7">
        <section aria-labelledby="sales-details-title">
          <h3 id="sales-details-title" className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Vendas
          </h3>
          <dl className="mt-3 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700">
                Estágio
                <span className="normal-case tracking-normal text-muted">Clica para mudar</span>
              </dt>
              <dd className="flex items-center gap-3">
                <div className="group relative w-full sm:max-w-sm">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-4 top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-current opacity-70"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm transition-transform group-hover:-translate-y-1"
                  >
                    ▾
                  </span>
                  <select
                    aria-label="Estágio"
                    value={funnelStage}
                    disabled={isPending}
                    onChange={(event) => {
                      const nextStage = event.target.value as FunnelStage;
                      const previousStage = funnelStage;
                      setFunnelStage(nextStage);
                      setError(null);
                      startTransition(async () => {
                        const result = await updateProspectFunnelAction(prospect.id, nextStage);
                        if (!result.data) {
                          setFunnelStage(previousStage);
                          setError(result.error);
                          return;
                        }
                        onProspectUpdated(result.data);
                      });
                    }}
                    className={`h-12 w-full cursor-pointer appearance-none rounded-xl border-2 py-0 pl-10 pr-11 text-sm font-semibold shadow-sm outline-none transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-4 focus-visible:ring-accent/15 disabled:cursor-wait disabled:translate-y-0 disabled:opacity-60 ${meta.active}`}
                  >
                    {STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {STAGE_META[stage].label}
                      </option>
                    ))}
                  </select>
                </div>
                {isPending && <span className="text-xs text-muted">A guardar…</span>}
              </dd>
              {error && (
                <p role="alert" className="mt-2 text-xs text-red-700">
                  {error}
                </p>
              )}
            </div>
            <Detail label="Pontuação">{prospect.prospect_score?.toLocaleString("pt-PT") ?? "—"}</Detail>
            <Detail label="Segmento">{prospect.segment}</Detail>
            <Detail label="Canal preferido">{prospect.preferred_channel ?? "—"}</Detail>
            <Detail label="Último contacto">{formatDate(prospect.last_contacted_at)}</Detail>
            <Detail label="Tags">
              {prospect.tags.length ? (
                <span className="flex flex-wrap gap-1.5">
                  {prospect.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                      {tag}
                    </span>
                  ))}
                </span>
              ) : (
                "—"
              )}
            </Detail>
            <Detail label="Fonte">{prospect.source ?? "—"}</Detail>
          </dl>
        </section>

        <NextActionSection prospect={prospect} onProspectUpdated={onProspectUpdated} />

        <ActivitySection prospect={prospect} />

        <ProspectContacts prospectId={prospect.id} />

        <section aria-labelledby="business-details-title" className="mt-8 border-t border-border pt-6">
          <h3 id="business-details-title" className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Negócio
          </h3>
          <dl className="mt-3 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <Detail label="Email">
              {prospect.email ? <ContactLink href={`mailto:${prospect.email}`}>{prospect.email}</ContactLink> : "—"}
            </Detail>
            <Detail label="Telefone">
              {prospect.phone ? <ContactLink href={`tel:${prospect.phone}`}>{prospect.phone}</ContactLink> : "—"}
            </Detail>
            <Detail label="Site">
              {prospect.website ? <ContactLink href={prospect.website}>{prospect.website}</ContactLink> : "—"}
            </Detail>
            <Detail label="Google Maps">
              {prospect.google_maps_url ? (
                <ContactLink href={prospect.google_maps_url}>Ver no mapa</ContactLink>
              ) : (
                "—"
              )}
            </Detail>
            <Detail label="Instagram">
              {prospect.instagram_url ? <ContactLink href={prospect.instagram_url}>{prospect.instagram_url}</ContactLink> : "—"}
            </Detail>
            <Detail label="Facebook">
              {prospect.facebook_url ? <ContactLink href={prospect.facebook_url}>{prospect.facebook_url}</ContactLink> : "—"}
            </Detail>
          </dl>
        </section>

        <section aria-labelledby="notes-title" className="mt-8 border-t border-border pt-6">
          <h3 id="notes-title" className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Notas
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
            {prospect.notes || "Sem notas registadas."}
          </p>
        </section>

        <section className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p className="text-xs text-muted">Remover apaga o prospect e o seu histórico de atividade permanentemente.</p>
          <div className="flex items-center gap-2">
            {confirmingDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                if (!confirmingDelete) {
                  setConfirmingDelete(true);
                  return;
                }
                setDeleteError(null);
                startDeleteTransition(async () => {
                  const result = await deleteProspectAction(prospect.id);
                  if (result.error) {
                    setDeleteError(result.error);
                    setConfirmingDelete(false);
                    return;
                  }
                  onProspectDeleted();
                });
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40 disabled:opacity-60 ${
                confirmingDelete ? "bg-red-600 text-white hover:bg-red-700" : "border border-red-200 text-red-700 hover:bg-red-50"
              }`}
            >
              {isDeleting ? "A remover…" : confirmingDelete ? "Confirmar remoção" : "Remover prospect"}
            </button>
          </div>
          {deleteError && (
            <p role="alert" className="w-full text-xs text-red-700">
              {deleteError}
            </p>
          )}
        </section>
      </div>
    </Drawer>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

function ContactLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="text-accent underline decoration-accent/25 underline-offset-2 hover:decoration-accent"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </a>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
