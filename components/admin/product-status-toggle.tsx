export const BULK_STATUS_FORM_ID = "bulk-status-form";

// Case rattachée au formulaire global (attribut `form`) : rien n'est
// enregistré tant qu'on ne clique pas sur « Enregistrer ».
// Cochée = brouillon, décochée = actif.
export function ProductStatusToggle({
  productId,
  status,
}: {
  productId: string;
  status: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700">
      <input
        type="hidden"
        name="allIds"
        value={productId}
        form={BULK_STATUS_FORM_ID}
      />
      <input
        type="checkbox"
        name="draft"
        value={productId}
        form={BULK_STATUS_FORM_ID}
        defaultChecked={status === "DRAFT"}
        className="h-4 w-4 accent-primary"
      />
      <span>Brouillon</span>
    </label>
  );
}
