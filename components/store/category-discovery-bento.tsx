import { prisma } from "@/lib/prisma";
import { CategoryBentoTile } from "./category-bento-tile";

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
  /** Photos de secours utilisées tant que la catégorie n'a pas assez de produits. */
  fallbackImages: string[];
};

const HIGHLIGHTS: Highlight[] = [
  {
    key: "bijouterie",
    family: "Bijouterie",
    title: "Bracelets",
    href: "/categorie/bijouterie?type=bracelet",
    categorySlug: "bijouterie",
    nameKeyword: "bracelet",
    fallbackImages: ["/zag-bijoux.jpg", "/zag-bijoux2.jpg", "/zag-bijoux3.jpg"],
  },
  {
    key: "perlerie",
    family: "Perlerie",
    title: "Perles",
    href: "/categorie/perlerie",
    categorySlug: "perlerie",
    nameKeyword: "perle",
    fallbackImages: ["/perlerie.jpg", "/images-1.jpg", "/atelier.jpg"],
  },
  {
    key: "jeux-diy",
    family: "Jeux & DIY",
    title: "Puzzles",
    href: "/categorie/jeux-diy-puzzles",
    categorySlug: "jeux-diy",
    nameKeyword: "puzzle",
    fallbackImages: ["/atelier.jpg", "/images-1.jpg", "/hero.jpg"],
  },
  {
    key: "lifestyle",
    family: "Lifestyle",
    title: "Maroquinerie",
    href: "/categorie/lifestyle-maroquinerie",
    categorySlug: "lifestyle",
    nameKeyword: "sac",
    fallbackImages: [
      "/charly-therapy.jpg",
      "/charly-therapy2.jpg",
      "/charly-thérapy3.jpg",
    ],
  },
  {
    key: "decoration-maison",
    family: "Décoration & Maison",
    title: "Décoration murale",
    href: "/categorie/decoration-maison-murale",
    categorySlug: "decoration-maison",
    nameKeyword: "plateau",
    fallbackImages: ["/atelier.jpg", "/hero.jpg", "/images-1.jpg"],
  },
  {
    key: "papeterie",
    family: "Papeterie",
    title: "Papeterie",
    href: "/categorie/papeterie",
    categorySlug: "papeterie",
    nameKeyword: "carnet",
    fallbackImages: ["/images-1.jpg", "/perlerie.jpg", "/atelier.jpg"],
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

  const MAX_IMAGES_PER_TILE = 6;

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

    // Mettre en premier les produits dont le nom correspond au mot-clé
    const keywordMatches = highlight.nameKeyword
      ? candidates.filter((p) =>
          p.name.toLowerCase().includes(highlight.nameKeyword!.toLowerCase()),
        )
      : [];
    const others = candidates.filter((p) => !keywordMatches.includes(p));
    const ordered = [...keywordMatches, ...others];

    // Collecter jusqu'à MAX_IMAGES_PER_TILE images uniques
    const images: string[] = [];
    for (const product of ordered) {
      for (const img of toStringArray(product.images)) {
        if (!images.includes(img)) images.push(img);
        if (images.length >= MAX_IMAGES_PER_TILE) break;
      }
      if (images.length >= MAX_IMAGES_PER_TILE) break;
    }

    for (const fallbackImage of highlight.fallbackImages) {
      if (!images.includes(fallbackImage)) images.push(fallbackImage);
      if (images.length >= MAX_IMAGES_PER_TILE) break;
    }

    return { ...highlight, images };
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
          <CategoryBentoTile
            key={tile.key}
            href={tile.href}
            family={tile.family}
            title={tile.title}
            images={tile.images}
          />
        ))}
      </div>
    </section>
  );
}
