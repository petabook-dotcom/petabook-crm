"use client";

import { useActionState } from "react";
import { unlockCrmAction, type AccessState } from "./actions";

const initialState: AccessState = { error: null };

export function AccessForm({ destination }: { destination: string }) {
  const [state, formAction, isPending] = useActionState(unlockCrmAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="from" value={destination} />
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
          Palavra-passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
        />
      </div>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
      >
        {isPending ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}
