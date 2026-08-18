"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getProspectActivitiesAction,
  logActivityAction,
  setNextActionAction,
} from "@/app/pipeline/actions";
import { CLOSED_STAGES, type ActivityType, type Prospect, type ProspectActivity } from "@/types/crm";

const LOGGABLE_TYPES: { value: ActivityType; label: string }[] = [
  { value: "note", label: "Nota" },
  { value: "email", label: "Email" },
  { value: "call", label: "Chamada" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "meeting", label: "Reunião" },
  { value: "visit", label: "Visita" },
];

const TYPE_LABELS: Record<ActivityType, string> = {
  note: "Nota",
  email: "Email",
  call: "Chamada",
  whatsapp: "WhatsApp",
  meeting: "Reunião",
  visit: "Visita",
  stage_change: "Mudança de fase",
};

const TYPE_DOTS: Record<ActivityType, string> = {
  note: "bg-neutral-400",
  email: "bg-blue-500",
  call: "bg-amber-500",
  whatsapp: "bg-green-600",
  meeting: "bg-violet-500",
  visit: "bg-orange-500",
  stage_change: "bg-emerald-600",
};

export function isOverdue(prospect: Prospect) {
  return Boolean(
    prospect.next_action_at &&
      prospect.next_action_at < new Date().toISOString().slice(0, 10) &&
      !CLOSED_STAGES.includes(prospect.funnel_stage),
  );
}

export function NextActionSection({
  prospect,
  onProspectUpdated,
}: {
  prospect: Prospect;
  onProspectUpdated: (prospect: Prospect) => void;
}) {
  const [date, setDate] = useState(prospect.next_action_at ?? "");
  const [note, setNote] = useState(prospect.next_action_note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dirty = date !== (prospect.next_action_at ?? "") || note !== (prospect.next_action_note ?? "");
  const overdue = isOverdue(prospect);

  return (
    <section aria-labelledby="next-action-title" className="mt-8 border-t border-border pt-6">
      <h3
        id="next-action-title"
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent"
      >
        Próxima ação
        {overdue && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-amber-800">
            Em atraso
          </span>
        )}
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setSaved(false);
          }}
          aria-label="Data da próxima ação"
          className="h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
        />
        <input
          type="text"
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setSaved(false);
          }}
          placeholder="Qual é o próximo passo? ex: Enviar proposta"
          aria-label="Nota da próxima ação"
          className="h-10 min-w-52 flex-1 rounded-lg border border-border bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/10"
        />
        <button
          type="button"
          disabled={isPending || !dirty}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await setNextActionAction(prospect.id, date, note);
              if (!result.data) {
                setError(result.error);
                return;
              }
              onProspectUpdated(result.data);
              setSaved(true);
            });
          }}
          className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "A guardar…" : "Guardar"}
        </button>
        {saved && !dirty && <span className="text-xs text-emerald-700">Guardado ✓</span>}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}

export function ActivitySection({ prospect }: { prospect: Prospect }) {
  const [activities, setActivities] = useState<ProspectActivity[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [type, setType] = useState<ActivityType>("note");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getProspectActivitiesAction(prospect.id).then((result) => {
      if (cancelled) return;
      if (result.data) setActivities(result.data);
      else setLoadError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [prospect.id]);

  return (
    <section aria-labelledby="activity-title" className="mt-8 border-t border-border pt-6">
      <h3 id="activity-title" className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        Atividade
      </h3>

      <div className="mt-3 flex flex-wrap items-start gap-2">
        <div className="relative">
          <select
            value={type}
            onChange={(event) => setType(event.target.value as ActivityType)}
            aria-label="Tipo de atividade"
            className="h-10 appearance-none rounded-lg border border-border bg-white px-3 pr-8 text-sm text-neutral-700 outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
          >
            {LOGGABLE_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span aria-hidden className="pointer-events-none absolute right-3 top-2.5 text-xs text-muted">
            ▾
          </span>
        </div>
        <input
          type="text"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.form?.requestSubmit();
          }}
          placeholder="O que aconteceu? ex: Ligámos, pediram para retomar em maio"
          aria-label="Descrição da atividade"
          className="h-10 min-w-52 flex-1 rounded-lg border border-border bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/10"
        />
        <button
          type="button"
          disabled={isPending || !body.trim()}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await logActivityAction(prospect.id, type, body);
              if (!result.data) {
                setError(result.error);
                return;
              }
              setActivities((current) => [result.data!, ...(current ?? [])]);
              setBody("");
            });
          }}
          className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "A registar…" : "Registar"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5">
        {loadError && <p className="text-sm text-red-700">{loadError}</p>}
        {!loadError && activities === null && <p className="text-sm text-muted">A carregar atividade…</p>}
        {activities !== null && activities.length === 0 && (
          <p className="text-sm text-muted">
            Ainda sem atividade. Regista uma chamada, email ou nota para começar o histórico.
          </p>
        )}
        {activities !== null && activities.length > 0 && (
          <ol className="space-y-4">
            {activities.map((activity) => (
              <li key={activity.id} className="flex gap-3">
                <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${TYPE_DOTS[activity.type]}`} />
                <div className="min-w-0">
                  <p className="text-sm text-neutral-900">
                    <span className="font-medium">{TYPE_LABELS[activity.type]}</span>
                    {activity.body && <span className="text-neutral-700"> — {activity.body}</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDateTime(activity.occurred_at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
