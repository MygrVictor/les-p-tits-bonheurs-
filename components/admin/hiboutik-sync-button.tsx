"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  syncHiboutikAction,
  type HiboutikSyncState,
} from "@/app/(admin)/admin/produits/hiboutik-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-blush-50 disabled:opacity-50"
    >
      {pending ? "Synchronisation…" : "⟳ Synchroniser le stock Hiboutik"}
    </button>
  );
}

export function HiboutikSyncButton() {
  const [state, action] = useFormState<HiboutikSyncState, FormData>(
    syncHiboutikAction,
    null,
  );
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <SubmitButton />
      {state && (
        <p
          className={`text-xs ${state.ok ? "text-green-700" : "text-red-600"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
