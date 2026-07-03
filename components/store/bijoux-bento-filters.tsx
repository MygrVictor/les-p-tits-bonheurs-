import Link from "next/link";
import Image from "next/image";

type Material = "acier-inox" | "plaque-or";
type BijouType = "collier" | "bracelet" | "boucles" | "autres";
type PriceRange = "0-39" | "40-59" | "60+";

const MATERIAL_OPTIONS: {
  id: Material;
  label: string;
  helper: string;
}[] = [
  {
    id: "acier-inox",
    label: "Acier inox",
    helper: "Résistant et durable",
  },
  {
    id: "plaque-or",
    label: "Plaqué or",
    helper: "Finition dorée",
  },
];

const TYPE_OPTIONS: {
  id: BijouType;
  label: string;
  helper: string;
  image: string;
}[] = [
  {
    id: "collier",
    label: "Collier",
    helper: "Tous les colliers",
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80",
  },
  {
    id: "bracelet",
    label: "Bracelet",
    helper: "Tous les bracelets",
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=80",
  },
  {
    id: "boucles",
    label: "Boucles d’oreilles",
    helper: "Toutes les boucles",
    image:
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=1200&q=80",
  },
  {
    id: "autres",
    label: "Autres bijoux",
    helper: "Le reste de la sélection",
    image:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&q=80",
  },
];

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
  materials: Material[],
  type: BijouType | null,
  brands: string[],
  price: PriceRange | null,
) {
  const params = new URLSearchParams();
  if (materials.length > 0) {
    params.set("matiere", materials.join(","));
  }
  if (type) {
    params.set("type", type);
  }
  if (brands.length > 0) {
    params.set("brand", brands.join(","));
  }
  if (price) {
    params.set("prix", price);
  }
  const query = params.toString();
  return query ? `/categorie/bijoux?${query}` : "/categorie/bijoux";
}

export function BijouxBentoFilters({
  selectedMaterials,
  selectedType,
  selectedBrands,
  selectedPrice,
  brandOptions,
}: Readonly<{
  selectedMaterials: Material[];
  selectedType: BijouType | null;
  selectedBrands: string[];
  selectedPrice: PriceRange | null;
  brandOptions: { id: string; name: string }[];
}>) {
  return (
    <div className="sticky top-20 space-y-5 rounded-2xl border border-neutral-100 bg-white p-5 shadow-soft">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Filtrer
        </p>
        <h2 className="mt-0.5 font-serif text-lg text-ink">Affiner</h2>
      </div>

      <div className="space-y-2 border-t border-neutral-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Matière
        </p>
        <div className="space-y-2">
          {MATERIAL_OPTIONS.map((material) => {
            const active = selectedMaterials.includes(material.id);
            const nextMaterials = active
              ? selectedMaterials.filter((item) => item !== material.id)
              : [...selectedMaterials, material.id];

            return (
              <Link
                key={material.id}
                href={buildHref(
                  nextMaterials,
                  selectedType,
                  selectedBrands,
                  selectedPrice,
                )}
                className={`block rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-primary bg-primary/15 text-ink ring-1 ring-primary/20"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-primary hover:bg-neutral-50"
                }`}
              >
                {material.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 border-t border-neutral-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Type
        </p>
        <div className="space-y-2">
          {TYPE_OPTIONS.map((type) => {
            const active = selectedType === type.id;
            const nextType = active ? null : type.id;

            return (
              <Link
                key={type.id}
                href={buildHref(
                  selectedMaterials,
                  nextType,
                  selectedBrands,
                  selectedPrice,
                )}
                className={`block rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-primary bg-primary/15 text-ink ring-1 ring-primary/20"
                    : "border-neutral-200 bg-white hover:border-primary"
                }`}
              >
                {type.label}
              </Link>
            );
          })}
        </div>
      </div>

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
                href={buildHref(
                  selectedMaterials,
                  selectedType,
                  nextBrands,
                  selectedPrice,
                )}
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

      <div className="space-y-3 rounded-2xl bg-amber-50/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Prix
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {PRICE_OPTIONS.map((price) => {
            const active = selectedPrice === price.id;
            const nextPrice = active ? null : price.id;

            return (
              <Link
                key={price.id}
                href={buildHref(
                  selectedMaterials,
                  selectedType,
                  selectedBrands,
                  nextPrice,
                )}
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
          href="/categorie/bijoux"
          className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-primary hover:text-ink"
        >
          Réinitialiser les filtres
        </Link>
      </div>
    </div>
  );
}
