"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  deleteContactAction,
  getProspectContactsAction,
  saveContactAction,
  type ContactFormState,
} from "@/app/pipeline/actions";
import { PlusIcon } from "@/components/icons";
import type { ProspectContact } from "@/types/crm";

export function ProspectContacts({ prospectId }: { prospectId: string }) {
  const [contacts, setContacts] = useState<ProspectContact[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null | "new">(null);

  function reload() {
    getProspectContactsAction(prospectId).then((result) => {
      if (result.data) setContacts(result.data);
      else setLoadError(result.error);
    });
  }

  useEffect(() => {
    let cancelled = false;
    getProspectContactsAction(prospectId).then((result) => {
      if (cancelled) return;
      if (result.data) setContacts(result.data);
      else setLoadError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [prospectId]);

  return (
    <section aria-labelledby="contacts-title" className="mt-8 border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <h3 id="contacts-title" className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Contactos
        </h3>
        {editingId === null && (
          <button
            type="button"
            onClick={() => setEditingId("new")}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
          >
            <PlusIcon className="size-3.5" />
            Adicionar contacto
          </button>
        )}
      </div>

      {loadError && <p className="mt-3 text-sm text-red-700">{loadError}</p>}
      {!loadError && contacts === null && <p className="mt-3 text-sm text-muted">A carregar contactos…</p>}

      {contacts !== null && (
        <div className="mt-3 space-y-2">
          {contacts.length === 0 && editingId !== "new" && (
            <p className="text-sm text-muted">Sem contactos registados. O dono, gerente ou receção contam.</p>
          )}
          {contacts.map((contact) =>
            editingId === contact.id ? (
              <ContactForm
                key={contact.id}
                prospectId={prospectId}
                contact={contact}
                onDone={() => {
                  setEditingId(null);
                  reload();
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <ContactRow
                key={contact.id}
                contact={contact}
                onEdit={() => setEditingId(contact.id)}
                onDeleted={reload}
              />
            ),
          )}
          {editingId === "new" && (
            <ContactForm
              prospectId={prospectId}
              contact={null}
              onDone={() => {
                setEditingId(null);
                reload();
              }}
              onCancel={() => setEditingId(null)}
            />
          )}
        </div>
      )}
    </section>
  );
}

function ContactRow({
  contact,
  onEdit,
  onDeleted,
}: {
  contact: ProspectContact;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2.5">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium text-neutral-900">
          {contact.name}
          {contact.is_primary && (
            <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
              Principal
            </span>
          )}
        </p>
        {contact.role && <p className="text-xs text-neutral-500">{contact.role}</p>}
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="text-accent hover:underline">
              {contact.email}
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="text-neutral-600 hover:text-accent">
              {contact.phone}
            </a>
          )}
          {contact.whatsapp && <span className="text-neutral-600">WhatsApp: {contact.whatsapp}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={onEdit} className="rounded-md px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100">
          Editar
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirming) {
              setConfirming(true);
              return;
            }
            startTransition(async () => {
              await deleteContactAction(contact.id);
              onDeleted();
            });
          }}
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            confirming ? "bg-red-600 text-white" : "text-red-600 hover:bg-red-50"
          }`}
        >
          {isPending ? "…" : confirming ? "Confirmar" : "Remover"}
        </button>
      </div>
    </div>
  );
}

const initialContactState: ContactFormState = { error: null, contact: null };

function ContactForm({
  prospectId,
  contact,
  onDone,
  onCancel,
}: {
  prospectId: string;
  contact: ProspectContact | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    saveContactAction.bind(null, prospectId, contact?.id ?? null),
    initialContactState,
  );

  useEffect(() => {
    if (state.contact) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.contact]);

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="name"
          placeholder="Nome *"
          defaultValue={contact?.name}
          required
          className="h-9 rounded-md border border-border bg-white px-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          name="role"
          placeholder="Função (ex: Proprietário)"
          defaultValue={contact?.role ?? ""}
          className="h-9 rounded-md border border-border bg-white px-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          defaultValue={contact?.email ?? ""}
          className="h-9 rounded-md border border-border bg-white px-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          name="phone"
          type="tel"
          placeholder="Telefone"
          defaultValue={contact?.phone ?? ""}
          className="h-9 rounded-md border border-border bg-white px-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          name="whatsapp"
          placeholder="WhatsApp"
          defaultValue={contact?.whatsapp ?? ""}
          className="h-9 rounded-md border border-border bg-white px-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          name="linkedin_url"
          placeholder="LinkedIn"
          defaultValue={contact?.linkedin_url ?? ""}
          className="h-9 rounded-md border border-border bg-white px-2.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-neutral-700">
        <input type="checkbox" name="is_primary" defaultChecked={contact?.is_primary ?? false} className="size-3.5" />
        Contacto principal
      </label>
      {state.error && <p className="text-xs text-red-700">{state.error}</p>}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "A guardar…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
