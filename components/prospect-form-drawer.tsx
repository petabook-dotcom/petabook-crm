"use client";

import { useActionState, useEffect } from "react";
import { saveProspectAction, type ProspectFormState } from "@/app/pipeline/actions";
import { Drawer } from "@/components/drawer";
import { CloseIcon } from "@/components/icons";
import { TagInput } from "@/components/tag-input";
import { STAGES, STAGE_META, type Prospect } from "@/types/crm";

const initialState: ProspectFormState = { error: null, prospect: null };

export function ProspectFormDrawer({
  prospect,
  onClose,
  onSaved,
}: {
  prospect: Prospect | null;
  onClose: () => void;
  onSaved: (prospect: Prospect) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    saveProspectAction.bind(null, prospect?.id ?? null),
    initialState,
  );

  useEffect(() => {
    if (state.prospect) onSaved(state.prospect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.prospect]);

  return (
    <Drawer labelledBy="prospect-form-title" onClose={onClose}>
      <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-border bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
        <div>
          <h2 id="prospect-form-title" className="text-2xl font-semibold tracking-tight">
            {prospect ? "Editar prospect" : "Novo prospect"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {prospect ? `Atualizar dados de ${prospect.business_name}.` : "Adicionar um novo prospect ao pipeline."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 text-muted hover:bg-neutral-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Fechar formulário"
        >
          <CloseIcon />
        </button>
      </header>

      <form action={formAction} className="px-5 py-6 sm:px-7">
        <fieldset disabled={isPending} className="space-y-6">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Negócio</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Nome do negócio *">
                <TextInput name="business_name" defaultValue={prospect?.business_name} required />
              </Field>
              <Field label="Nome legal">
                <TextInput name="legal_name" defaultValue={prospect?.legal_name ?? ""} />
              </Field>
              <Field label="Região *">
                <TextInput name="region" defaultValue={prospect?.region} required />
              </Field>
              <Field label="Cidade *">
                <TextInput name="city" defaultValue={prospect?.city} required />
              </Field>
              <Field label="Morada">
                <TextInput name="address" defaultValue={prospect?.address ?? ""} />
              </Field>
              <Field label="Email">
                <TextInput name="email" type="email" defaultValue={prospect?.email ?? ""} />
              </Field>
              <Field label="Telefone">
                <TextInput name="phone" type="tel" defaultValue={prospect?.phone ?? ""} />
              </Field>
              <Field label="Site">
                <TextInput name="website" defaultValue={prospect?.website ?? ""} />
              </Field>
              <Field label="Instagram">
                <TextInput name="instagram_url" defaultValue={prospect?.instagram_url ?? ""} />
              </Field>
              <Field label="Facebook">
                <TextInput name="facebook_url" defaultValue={prospect?.facebook_url ?? ""} />
              </Field>
              <Field label="Google Maps">
                <TextInput name="google_maps_url" defaultValue={prospect?.google_maps_url ?? ""} />
              </Field>
              <Field label="Fonte">
                <TextInput name="source" defaultValue={prospect?.source ?? ""} />
              </Field>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Vendas</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Estágio">
                <SelectInput name="funnel_stage" defaultValue={prospect?.funnel_stage ?? "Prospect"}>
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {STAGE_META[stage].label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Pontuação">
                <TextInput
                  name="prospect_score"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={prospect?.prospect_score ?? ""}
                />
              </Field>
              <Field label="Segmento">
                <TextInput name="segment" defaultValue={prospect?.segment ?? ""} placeholder="Hotel canino" />
              </Field>
              <Field label="Canal preferido">
                <SelectInput name="preferred_channel" defaultValue={prospect?.preferred_channel ?? ""}>
                  <option value="">—</option>
                  <option value="Email">Email</option>
                  <option value="Telefone">Telefone</option>
                  <option value="WhatsApp">WhatsApp</option>
                </SelectInput>
              </Field>
              <Field label="Último contacto">
                <TextInput name="last_contacted_at" type="date" defaultValue={prospect?.last_contacted_at ?? ""} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Tags">
                  <TagInput name="tags" initialTags={prospect?.tags ?? []} />
                </Field>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Notas</h3>
            <textarea
              name="notes"
              rows={4}
              defaultValue={prospect?.notes ?? ""}
              className="mt-3 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/10"
              placeholder="Contexto, objeções, detalhes de follow-up…"
            />
          </section>
        </fieldset>

        {state.error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "A guardar…" : prospect ? "Guardar alterações" : "Criar prospect"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/10"
    />
  );
}

function SelectInput({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="h-10 w-full appearance-none rounded-lg border border-border bg-white px-3 pr-8 text-sm text-neutral-700 outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
      >
        {children}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-3 top-2.5 text-xs text-muted">
        ▾
      </span>
    </div>
  );
}
