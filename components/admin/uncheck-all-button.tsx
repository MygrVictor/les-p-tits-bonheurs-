"use client";

export function UncheckAllButton({ formId }: { formId: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        document
          .querySelectorAll<HTMLInputElement>(
            `input[type="checkbox"][name="draft"][form="${formId}"]`,
          )
          .forEach((input) => {
            input.checked = false;
          });
      }}
      className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
    >
      Tout décocher
    </button>
  );
}
