"use client";

import { useTransition } from "react";
import { toggleProductDraftStatus } from "@/app/(admin)/admin/actions";

export function ProductStatusToggle({
  productId,
  status,
}: {
  productId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={toggleProductDraftStatus.bind(null, productId)}
      className="flex items-center gap-2"
    >
      <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700">
        <input
          type="checkbox"
          name="isDraft"
          defaultChecked={status === "DRAFT"}
          disabled={isPending}
          onChange={(event) => {
            const form = event.currentTarget.form;
            if (!form) return;
            startTransition(() => {
              form.requestSubmit();
            });
          }}
          className="h-4 w-4 accent-primary"
        />
        <span>{isPending ? "..." : "Brouillon"}</span>
      </label>
    </form>
  );
}
