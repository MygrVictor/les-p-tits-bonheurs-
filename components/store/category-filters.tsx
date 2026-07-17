import Link from "next/link";
import type { PriceRange } from "@/lib/category-filters";

export type FilterOption = {
  id: string;
  label: string;
  helper?: string;
  /** Couleur de la pastille (uniquement pour un groupe `variant: "swatch"`). */
  hex?: string;
};

export type FilterGroup = {
  /** Nom du paramètre d'URL (ex. "type", "pieces", "couleur"). */
  paramName: string;
  /** Titre affiché au-dessus du groupe (ex. "Type", "Nombre de pièces"). */
  title: string;
  options: FilterOption[];
  selected: string | null;
  /** "swatch" affiche des pastilles rondes colorées plutôt que des blocs texte. */
  variant?: "text" | "swatch";
};

const PRICE_OPTIONS: {
  id: PriceRange;
  label: string;
  helper: string;
  tone: string;
}[] = [
  {
    id: "0-39",
    label: "Moins de 40€",
    helper: "Petit prix",
    tone: "from-rose-50 to-orange-50",
  },
  {
    id: "40-59",
    label: "40€ à 59€",
    helper: "Milieu de gamme",
    tone: "from-amber-50 to-rose-50",
  },
  {
    id: "60+",
    label: "60€ et +",
    helper: "Pièces premium",
    tone: "from-fuchsia-50 to-rose-50",
  },
];

function buildHref(
  categoryHref: string,
  activeParams: Record<string, string | null>,
  brands: string[],
) {
  // `categoryHref` peut déjà contenir une query string à préserver (ex. la
  // page recherche a besoin de garder `?q=...` quand on clique un filtre).
  const [basePath, existingQuery] = categoryHref.split("?");
  const params = new URLSearchParams(existingQuery ?? "");
  for (const [key, value] of Object.entries(activeParams)) {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  }
  if (brands.length > 0) {
    params.set("brand", brands.join(","));
  } else {
    params.delete("brand");
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * Sidebar de filtres "basiques" pour une page catégorie : un ou plusieurs
 * groupes "Type" (facultatifs, propres à la famille de produits), plus
 * Marques et Prix qui s'appliquent partout. Voir lib/category-filters.ts
 * pour la configuration des groupes par catégorie.
 */
export function CategoryFilters({
  categoryHref,
  filterGroups,
  selectedBrands,
  selectedPrice,
  brandOptions,
}: Readonly<{
  categoryHref: string;
  filterGroups: FilterGroup[];
  selectedBrands: string[];
  selectedPrice: PriceRange | null;
  brandOptions: { id: string; name: string }[];
}>) {
  const baseParams: Record<string, string | null> = { prix: selectedPrice };
  for (const group of filterGroups) {
    baseParams[group.paramName] = group.selected;
  }

  return (
    <div className="sticky top-20 space-y-5 rounded-2xl border border-neutral-100 bg-white p-5 shadow-soft">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Filtrer
        </p>
        <h2 className="mt-0.5 font-serif text-lg text-ink">Affiner</h2>
      </div>

      {filterGroups.map((group) => (
        <div
          key={group.paramName}
          className="space-y-2 border-t border-neutral-100 pt-4"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            {group.title}
          </p>
          {group.variant === "swatch" ? (
            <div className="flex flex-wrap gap-3">
              {group.options.map((option) => {
                const active = group.selected === option.id;
                const nextValue = active ? null : option.id;
                const nextParams = {
                  ...baseParams,
                  [group.paramName]: nextValue,
                };

                return (
                  <Link
                    key={option.id}
                    href={buildHref(categoryHref, nextParams, selectedBrands)}
                    title={option.label}
                    aria-label={option.label}
                    className="group/swatch flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={`h-9 w-9 rounded-full border shadow-sm transition ${
                        active
                          ? "ring-2 ring-primary ring-offset-2"
                          : "border-neutral-200 group-hover/swatch:ring-2 group-hover/swatch:ring-neutral-200 group-hover/swatch:ring-offset-2"
                      }`}
                      style={{
                        backgroundColor: option.hex || "#e5e5e5",
                        backgroundImage: option.hex
                          ? undefined
                          : "conic-gradient(#D64545,#E8C547,#6FA582,#4B7BA6,#8D70C7,#D64545)",
                      }}
                    />
                    <span className="max-w-[4rem] truncate text-[10px] font-medium text-neutral-600">
                      {option.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {group.options.map((option) => {
                const active = group.selected === option.id;
                const nextValue = active ? null : option.id;
                const nextParams = {
                  ...baseParams,
                  [group.paramName]: nextValue,
                };

                return (
                  <Link
                    key={option.id}
                    href={buildHref(categoryHref, nextParams, selectedBrands)}
                    className={`block rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-primary bg-primary/15 text-ink ring-1 ring-primary/20"
                        : "border-neutral-200 bg-white hover:border-primary"
                    }`}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {brandOptions.length > 0 && (
        <div className="space-y-2 border-t border-neutral-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Marques
          </p>
          <div className="space-y-2">
            {brandOptions.map((brand) => {
              const active = selectedBrands.includes(brand.id);
              const nextBrands = active
                ? selectedBrands.filter((id) => id !== brand.id)
                : [...selectedBrands, brand.id];

              return (
                <Link
                  key={brand.id}
                  href={buildHref(categoryHref, baseParams, nextBrands)}
                  className={`block rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-primary bg-primary/15 text-ink ring-1 ring-primary/20"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-primary hover:bg-neutral-50"
                  }`}
                >
                  {brand.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-2xl bg-amber-50/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Prix
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {PRICE_OPTIONS.map((price) => {
            const active = selectedPrice === price.id;
            const nextPrice = active ? null : price.id;
            const nextParams = { ...baseParams, prix: nextPrice };

            return (
              <Link
                key={price.id}
                href={buildHref(categoryHref, nextParams, selectedBrands)}
                className={`rounded-2xl border bg-gradient-to-br p-4 transition ${price.tone} ${
                  active
                    ? "border-primary bg-primary/15 text-ink ring-1 ring-primary/20"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-primary hover:bg-primary/5"
                }`}
              >
                <p className="text-sm font-semibold">{price.label}</p>
                <p className="mt-1 text-xs opacity-75">{price.helper}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href={categoryHref}
          className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-primary hover:text-ink"
        >
          Réinitialiser les filtres
        </Link>
      </div>
    </div>
  );
}
