"use client";

import Link from "next/link";
import { useState } from "react";

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

const MIN_PRICE_EUR = 5;
const MAX_PRICE_EUR = 200;
const PRICE_STEP_EUR = 5;

function splitHref(href: string) {
  const [basePath, existingQuery] = href.split("?");
  return { basePath, existingQuery };
}

function buildSearchParamsFromHref(href: string) {
  const { existingQuery } = splitHref(href);
  return new URLSearchParams(existingQuery ?? "");
}

function buildHref(
  categoryHref: string,
  activeParams: Record<string, string | null>,
  brands: string[],
) {
  // `categoryHref` peut déjà contenir une query string à préserver (ex. la
  // page recherche a besoin de garder `?q=...` quand on clique un filtre).
  const { basePath } = splitHref(categoryHref);
  const params = buildSearchParamsFromHref(categoryHref);
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
  selectedMinPrice,
  selectedMaxPrice,
  availableMinPrice,
  availableMaxPrice,
  brandOptions,
}: Readonly<{
  categoryHref: string;
  filterGroups: FilterGroup[];
  selectedBrands: string[];
  selectedMinPrice: number | null;
  selectedMaxPrice: number | null;
  availableMinPrice: number | null;
  availableMaxPrice: number | null;
  brandOptions: { id: string; name: string }[];
}>) {
  const minBound = availableMinPrice ?? MIN_PRICE_EUR;
  const maxBound = availableMaxPrice ?? MAX_PRICE_EUR;
  const hasPriceBounds =
    Number.isFinite(minBound) &&
    Number.isFinite(maxBound) &&
    maxBound >= minBound;

  const clampedMin =
    typeof selectedMinPrice === "number"
      ? Math.min(maxBound, Math.max(minBound, selectedMinPrice))
      : minBound;
  const clampedMax =
    typeof selectedMaxPrice === "number"
      ? Math.min(maxBound, Math.max(minBound, selectedMaxPrice))
      : maxBound;

  const rangeMin = Math.min(clampedMin, clampedMax);
  const rangeMax = Math.max(clampedMin, clampedMax);

  const [liveMinPrice, setLiveMinPrice] = useState(rangeMin);
  const [liveMaxPrice, setLiveMaxPrice] = useState(rangeMax);

  const displayMinPrice = Math.min(liveMinPrice, liveMaxPrice);
  const displayMaxPrice = Math.max(liveMinPrice, liveMaxPrice);

  const baseParams: Record<string, string | null> = {
    prixMin: hasPriceBounds ? String(rangeMin) : null,
    prixMax: hasPriceBounds ? String(rangeMax) : null,
  };
  for (const group of filterGroups) {
    baseParams[group.paramName] = group.selected;
  }

  const { basePath } = splitHref(categoryHref);
  const resetHref = buildHref(categoryHref, {}, []);
  const sliderFormParams = buildSearchParamsFromHref(categoryHref);

  for (const [key, value] of Object.entries(baseParams)) {
    if (key === "prixMin" || key === "prixMax") continue;
    if (value) {
      sliderFormParams.set(key, value);
    } else {
      sliderFormParams.delete(key);
    }
  }

  if (selectedBrands.length > 0) {
    sliderFormParams.set("brand", selectedBrands.join(","));
  } else {
    sliderFormParams.delete("brand");
  }

  const hiddenEntries = Array.from(sliderFormParams.entries()).filter(
    ([key]) => key !== "page",
  );

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

      {hasPriceBounds && (
        <div className="space-y-3 rounded-2xl bg-amber-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Prix
          </p>
          <form action={basePath} method="get" className="space-y-3">
            {hiddenEntries.map(([key, value], index) => (
              <input
                key={`${key}-${value}-${index}`}
                type="hidden"
                name={key}
                value={value}
              />
            ))}

            <div className="rounded-xl border border-neutral-200 bg-white px-3 py-3">
              <p className="text-xs font-semibold text-neutral-600">
                Du plus petit au plus grand
              </p>

              <div className="mt-3 space-y-2">
                <label className="block text-[11px] font-medium text-neutral-500">
                  Prix minimum · {displayMinPrice}€
                </label>
                <input
                  type="range"
                  name="prixMin"
                  min={minBound}
                  max={maxBound}
                  step={PRICE_STEP_EUR}
                  value={liveMinPrice}
                  onChange={(event) => {
                    setLiveMinPrice(Number.parseInt(event.target.value, 10));
                  }}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-primary"
                />
              </div>

              <div className="mt-3 space-y-2">
                <label className="block text-[11px] font-medium text-neutral-500">
                  Prix maximum · {displayMaxPrice}€
                </label>
                <input
                  type="range"
                  name="prixMax"
                  min={minBound}
                  max={maxBound}
                  step={PRICE_STEP_EUR}
                  value={liveMaxPrice}
                  onChange={(event) => {
                    setLiveMaxPrice(Number.parseInt(event.target.value, 10));
                  }}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-primary"
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>{minBound}€</span>
                <span className="font-semibold text-ink">
                  {displayMinPrice}€ → {displayMaxPrice}€
                </span>
                <span>{maxBound}€</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              >
                Appliquer
              </button>
              <Link
                href={buildHref(
                  categoryHref,
                  { ...baseParams, prixMin: null, prixMax: null },
                  selectedBrands,
                )}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-primary hover:text-ink"
              >
                Supprimer le prix
              </Link>
            </div>
          </form>
        </div>
      )}

      <div className="flex justify-end">
        <Link
          href={resetHref}
          className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-primary hover:text-ink"
        >
          Réinitialiser les filtres
        </Link>
      </div>
    </div>
  );
}
