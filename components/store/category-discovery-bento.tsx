import Link from "next/link";
import { SafeImage } from "@/components/ui/image";
import { prisma } from "@/lib/prisma";

/**
 * Bento « Nos univers » — 6 tuiles carrées, une par grande famille du menu
 * (Bijouterie, Perlerie, Jeux & DIY, Lifestyle, Décoration & Maison,
 * Papeterie), chacune illustrée par une vraie photo produit de la
 * catégorie visée (pas un simple aplat de couleur) et pointant vers une
 * sous-catégorie/un type précis plutôt que la famille entière.
 *
 * L'illustration de chaque tuile est choisie automatiquement en base :
 * on cherche d'abord un produit dont le nom contient `nameKeyword` (ex.
 * "bracelet"), sinon on prend le premier produit actif de la catégorie,
 * sinon on retombe sur `fallbackImage` (utile tant qu'une famille n'a pas
 * encore de stock, ex. Perlerie).
 *
 * Pour changer une destination (ex. remplacer "Bracelets" par "Colliers"),
 * il suffit d'éditer l'entrée correspondante dans HIGHLIGHTS.
 */
type Highlight = {
  key: string;
  /** Nom de la grande famille (affiché en petit, au-dessus du titre). */
  family: string;
  /** Nom de la catégorie/du type précis mis en avant (titre de la tuile). */
  title: string;
  href: string;
  /** Slug de la catégorie racine (+ ses sous-catégories) où chercher une photo. */
  categorySlug: string;
  /** Mot-clé (insensible à la casse) recherché dans le nom du produit. */
  nameKeyword?: string;
  /** Photo utilisée si aucun produit actif n'est trouvé dans la catégorie. */
  fallbackImage: string;
};

const HIGHLIGHTS: Highlight[] = [
  {
    key: "bijouterie",
    family: "Bijouterie",
    title: "Bracelets",
    href: "/categorie/bijouterie?type=bracelet",
    categorySlug: "bijouterie",
    nameKeyword: "bracelet",
    fallbackImage: "/hero.jpg",
  },
  {
    key: "perlerie",
    family: "Perlerie",
    title: "Perles",
    href: "/categorie/perlerie",
    categorySlug: "perlerie",
    nameKeyword: "perle",
    fallbackImage: "/perlerie.jpg",
  },
  {
    key: "jeux-diy",
    family: "Jeux & DIY",
    title: "Puzzles",
    href: "/categorie/jeux-diy-puzzles",
    categorySlug: "jeux-diy",
    nameKeyword: "puzzle",
    fallbackImage: "/atelier.jpg",
  },
  {
    key: "lifestyle",
    family: "Lifestyle",
    title: "Maroquinerie",
    href: "/categorie/lifestyle-maroquinerie",
    categorySlug: "lifestyle",
    nameKeyword: "sac",
    fallbackImage: "/hero.jpg",
  },
  {
    key: "decoration-maison",
    family: "Décoration & Maison",
    title: "Décoration murale",
    href: "/categorie/decoration-maison-murale",
    categorySlug: "decoration-maison",
    nameKeyword: "plateau",
    fallbackImage: "/atelier.jpg",
  },
  {
    key: "papeterie",
    family: "Papeterie",
    title: "Papeterie",
    href: "/categorie/papeterie",
    categorySlug: "papeterie",
    nameKeyword: "carnet",
    fallbackImage: "/perlerie.jpg",
  },
];

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export async function CategoryDiscoveryBento() {
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true, parentId: true },
  });

  const categoryIdsBySlug = new Map<string, string[]>();
  for (const highlight of HIGHLIGHTS) {
    const root = categories.find((c) => c.slug === highlight.categorySlug);
    if (!root) {
      categoryIdsBySlug.set(highlight.categorySlug, []);
      continue;
    }
    const children = categories
      .filter((c) => c.parentId === root.id)
      .map((c) => c.id);
    categoryIdsBySlug.set(highlight.categorySlug, [root.id, ...children]);
  }

  const allCategoryIds = Array.from(
    new Set(Array.from(categoryIdsBySlug.values()).flat()),
  );

  const products =
    allCategoryIds.length > 0
      ? await prisma.product.findMany({
          where: { status: "ACTIVE", categoryId: { in: allCategoryIds } },
          select: { name: true, categoryId: true, images: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const tiles = HIGHLIGHTS.map((highlight) => {
    const categoryIds = categoryIdsBySlug.get(highlight.categorySlug) ?? [];
    const candidates = products.filter((p) =>
      categoryIds.includes(p.categoryId),
    );
    const keywordMatch = highlight.nameKeyword
      ? candidates.find((p) =>
          p.name.toLowerCase().includes(highlight.nameKeyword!.toLowerCase()),
        )
      : undefined;
    const chosen = keywordMatch ?? candidates[0];
    const chosenImages = chosen ? toStringArray(chosen.images) : [];
    const image = chosenImages[0] || highlight.fallbackImage;

    return { ...highlight, image };
  });

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          ✦ Nos univers
        </p>
        <h2 className="mt-1 font-serif text-3xl text-ink sm:text-4xl">
          Un aperçu de chaque famille.
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.key}
            href={tile.href}
            className="group relative aspect-square overflow-hidden border border-black/5 bg-neutral-100 shadow-soft"
          >
            <SafeImage
              src={tile.image}
              alt={tile.title}
              fill
              className="object-cover transition duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                {tile.family}
              </p>
              <p className="font-serif text-lg text-white sm:text-xl">
                {tile.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
