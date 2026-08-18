import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { DataError } from "@/components/data-error";
import { PageHeader } from "@/components/page-header";
import { getFollowUps, getRecentActivities, getStaleProspects } from "@/lib/prospect-activities";
import { getProspects } from "@/lib/queries";
import { CLOSED_STAGES, STAGES, STAGE_META, type Prospect } from "@/types/crm";

export const metadata: Metadata = { title: "Dashboard" };

const ACTIVITY_LABELS: Record<string, string> = {
  note: "Nota",
  email: "Email",
  call: "Chamada",
  whatsapp: "WhatsApp",
  meeting: "Reunião",
  visit: "Visita",
  stage_change: "Mudança de fase",
};

export default async function DashboardPage() {
  await connection();
  const [prospectsResult, followUpsResult, staleResult, activitiesResult] = await Promise.all([
    getProspects(),
    getFollowUps(),
    getStaleProspects(14),
    getRecentActivities(10),
  ]);

  if (!prospectsResult.data) {
    return (
      <>
        <PageHeader eyebrow="Visão geral" title="Dashboard" description="O que precisa de atenção hoje no pipeline de parceiros." />
        <DataError title="Não foi possível carregar os dados" message={prospectsResult.error} />
      </>
    );
  }

  const prospects = prospectsResult.data;
  const followUps = followUpsResult.data ?? [];
  const staleProspects = staleResult.data ?? [];
  const activities = activitiesResult.data ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const activeProspects = prospects.filter((p) => !CLOSED_STAGES.includes(p.funnel_stage)).length;
  const onboarding = prospects.filter((p) => p.funnel_stage === "Onboarding").length;
  const proposals = prospects.filter((p) => p.funnel_stage === "Proposal").length;

  const metrics = [
    { label: "Prospects ativos", value: String(activeProspects), href: "/pipeline" },
    { label: "Onboardings concluídos", value: String(onboarding), href: "/pipeline" },
    { label: "Em proposta", value: String(proposals), href: "/pipeline" },
    { label: "Follow-ups em atraso", value: String(followUps.filter((p) => p.next_action_at! < today).length), href: "/pipeline" },
  ];

  const maxStageCount = Math.max(1, ...STAGES.map((stage) => prospects.filter((p) => p.funnel_stage === stage).length));

  return (
    <>
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        description="O que precisa de atenção hoje no pipeline de aquisição de parceiros."
      />

      <section aria-label="Métricas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="group rounded-xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-neutral-300"
          >
            <p className="text-sm text-muted">{metric.label}</p>
            <p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-neutral-950">{metric.value}</p>
          </Link>
        ))}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm lg:col-span-2">
          <header className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold">Funil</h2>
            <Link href="/pipeline" className="text-xs font-medium text-accent hover:opacity-80">
              Abrir pipeline →
            </Link>
          </header>
          <div className="mt-4 space-y-3">
            {STAGES.map((stage) => {
              const count = prospects.filter((p) => p.funnel_stage === stage).length;
              const meta = STAGE_META[stage];
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="flex w-36 shrink-0 items-center gap-2 text-xs text-neutral-700">
                    <span aria-hidden className={`size-2 rounded-full ${meta.dot}`} />
                    <span className="truncate">{meta.label}</span>
                  </span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-neutral-100">
                    <div
                      className={`h-full rounded ${meta.dot} opacity-70`}
                      style={{ width: `${Math.max(count > 0 ? 4 : 0, (count / maxStageCount) * 100)}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right font-mono text-xs text-neutral-600">
                    {count} · {prospects.length ? Math.round((count / prospects.length) * 100) : 0}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <header className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold">Follow-ups por fazer</h2>
            <span className="text-xs text-muted">{followUps.length} no total</span>
          </header>
          {followUps.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
              Nada pendente. Define próximas ações nos prospects para construir a fila do dia.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {followUps.slice(0, 8).map((prospect: Prospect) => (
                <FollowUpRow key={prospect.id} prospect={prospect} today={today} />
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <header className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold">Prospects frios</h2>
            <span className="text-xs text-muted">Sem contacto há 14+ dias</span>
          </header>
          {staleProspects.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
              Nenhum. Todos os prospects ativos têm contacto recente ou uma próxima ação planeada.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {staleProspects.slice(0, 8).map((prospect: Prospect) => (
                <li key={prospect.id}>
                  <Link href={`/pipeline?prospect=${prospect.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-neutral-50/70">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-neutral-900">{prospect.business_name}</span>
                      <span className="block truncate text-xs text-muted">
                        {STAGE_META[prospect.funnel_stage].label} · {prospect.segment}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-amber-700">
                      {prospect.last_contacted_at
                        ? `${Math.floor((Date.parse(today) - Date.parse(prospect.last_contacted_at)) / 86_400_000)}d atrás`
                        : "Nunca contactado"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm lg:col-span-2">
          <header className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold">Atividade recente</h2>
          </header>
          {activities.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
              Ainda sem atividade registada. Mudanças de estágio e contactos registados aparecem aqui.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {activities.map((activity) => (
                <li key={activity.id} className="flex gap-3">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-neutral-900">
                      <Link href={`/pipeline?prospect=${activity.prospect_id}`} className="font-medium hover:text-accent">
                        {activity.business_name}
                      </Link>
                      <span className="text-neutral-600">
                        {" "}
                        · {ACTIVITY_LABELS[activity.type] ?? activity.type}
                        {activity.body ? ` — ${activity.body}` : ""}
                      </span>
                    </p>
                    <p className="text-xs text-muted">{formatRelative(activity.occurred_at, today)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function FollowUpRow({ prospect, today }: { prospect: Prospect; today: string }) {
  const overdue = Boolean(prospect.next_action_at && prospect.next_action_at < today);
  const daysOverdue = prospect.next_action_at
    ? Math.floor((Date.parse(today) - Date.parse(prospect.next_action_at)) / 86_400_000)
    : 0;

  return (
    <li>
      <Link href={`/pipeline?prospect=${prospect.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-neutral-50/70">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-neutral-900">{prospect.business_name}</span>
          <span className="block truncate text-xs text-muted">{prospect.next_action_note ?? STAGE_META[prospect.funnel_stage].label}</span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${overdue ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}>
          {overdue ? `${daysOverdue}d em atraso` : "Hoje"}
        </span>
      </Link>
    </li>
  );
}

function formatRelative(value: string, today: string) {
  const days = Math.floor((Date.parse(today) - Date.parse(value.slice(0, 10))) / 86_400_000);
  if (days <= 0) return "Hoje";
  if (days === 1) return "Ontem";
  return `${days}d atrás`;
}
