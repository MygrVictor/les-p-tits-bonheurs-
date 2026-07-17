/**
 * Configuration des filtres "basiques" (Type/Format + Marque + Prix)
 * disponibles sur chaque page catégorie du site.
 *
 * Marque et Prix sont génériques et s'appliquent automatiquement à toutes
 * les catégories (voir app/(store)/categorie/[slug]/page.tsx). Le(s)
 * filtre(s) "Type" (ou "Nombre de pièces" pour les puzzles) sont propres à
 * certaines familles de produits : ils sont déclarés ici, avec des
 * mots-clés utilisés pour deviner le type d'un produit à partir de son nom
 * (et de ses tags), faute d'un champ "type" structuré en base de données.
 *
 * Pour ajouter un filtre "Type" sur une nouvelle catégorie : ajoute une
 * entrée dans CATEGORY_FILTER_CONFIGS avec le(s) slug(s) concerné(s) et la
 * liste des options (id, label, aide, mots-clés). Si une catégorie n'a pas
 * d'entrée ici, elle affiche quand même les filtres Marque + Prix.
 */

export type FilterOptionConfig = {
  id: string;
  label: string;
  helper: string;
  /** Mots-clés (sans accents, insensibles à la casse) recherchés dans le
   * nom + les tags du produit pour lui attribuer cette valeur. */
  keywords: string[];
};

export type FilterGroupConfig = {
  /** Nom du paramètre d'URL (ex. "type", "pieces"). */
  paramName: "type" | "pieces";
  /** Titre affiché au-dessus du groupe de filtres (ex. "Type"). */
  title: string;
  options: FilterOptionConfig[];
};

export type CategoryFilterConfig = {
  /** Slugs de catégorie (ou de catégorie parente) concernés. */
  slugs: string[];
  groups: FilterGroupConfig[];
};

export type PriceRange = "0-39" | "40-59" | "60+";
export const PRICE_RANGE_IDS: readonly PriceRange[] = ["0-39", "40-59", "60+"];

export const CATEGORY_FILTER_CONFIGS: CategoryFilterConfig[] = [
  {
    slugs: [
      "bijouterie",
      "bijouterie-acier-inoxydable",
      "bijouterie-plaque-or",
    ],
    groups: [
      {
        paramName: "type",
        title: "Type",
        options: [
          {
            id: "collier",
            label: "Collier",
            helper: "Tous les colliers",
            keywords: ["collier"],
          },
          {
            id: "bracelet",
            label: "Bracelet",
            helper: "Tous les bracelets",
            keywords: ["bracelet"],
          },
          {
            id: "boucles",
            label: "Boucles d'oreilles",
            helper: "Toutes les boucles",
            keywords: ["boucles", "oreille"],
          },
          {
            id: "bagues",
            label: "Bagues",
            helper: "Toutes les bagues",
            keywords: ["bague"],
          },
          {
            id: "boites",
            label: "Boîtes à bijoux",
            helper: "Rangement & écrins",
            keywords: ["boite", "ecrin"],
          },
        ],
      },
    ],
  },
  {
    slugs: ["perlerie"],
    groups: [
      {
        paramName: "type",
        title: "Type",
        options: [
          {
            id: "perles",
            label: "Perles",
            helper: "Perles à l'unité ou en lot",
            keywords: ["perle"],
          },
          {
            id: "charms",
            label: "Charms",
            helper: "Charms & breloques",
            keywords: ["charm", "breloque"],
          },
          {
            id: "apprets",
            label: "Apprêts",
            helper: "Fermoirs, anneaux…",
            keywords: ["appret", "fermoir"],
          },
          {
            id: "chaines",
            label: "Chaînes",
            helper: "Chaînes au mètre",
            keywords: ["chaine"],
          },
          {
            id: "fils",
            label: "Fils",
            helper: "Fils & cordons",
            keywords: ["fil", "cordon"],
          },
          {
            id: "outils",
            label: "Outils",
            helper: "Pinces & outils",
            keywords: ["outil", "pince"],
          },
          {
            id: "kits",
            label: "Kits DIY",
            helper: "Kits prêts à l'emploi",
            keywords: ["kit"],
          },
        ],
      },
    ],
  },
  {
    slugs: ["jeux-diy-puzzles"],
    groups: [
      {
        paramName: "pieces",
        title: "Nombre de pièces",
        options: [
          {
            id: "100",
            label: "100 pièces",
            helper: "Format rapide",
            keywords: ["100"],
          },
          {
            id: "500",
            label: "500 pièces",
            helper: "Format intermédiaire",
            keywords: ["500"],
          },
          {
            id: "1000",
            label: "1000 pièces",
            helper: "Format classique",
            keywords: ["1000"],
          },
          {
            id: "1500",
            label: "1500 pièces",
            helper: "Format expert",
            keywords: ["1500"],
          },
        ],
      },
      {
        paramName: "type",
        title: "Format",
        options: [
          {
            id: "tapis",
            label: "Tapis de puzzle",
            helper: "Rangement & transport",
            keywords: ["tapis"],
          },
        ],
      },
    ],
  },
  {
    slugs: ["lifestyle-maroquinerie"],
    groups: [
      {
        paramName: "type",
        title: "Type",
        options: [
          {
            id: "bananes",
            label: "Bananes",
            helper: "Sacs banane",
            keywords: ["banane"],
          },
          {
            id: "sacs-lune",
            label: "Sacs lune",
            helper: "Forme demi-lune",
            keywords: ["lune"],
          },
          {
            id: "sacs-week-end",
            label: "Sacs week-end",
            helper: "Grands formats",
            keywords: ["week-end", "weekend", "week end"],
          },
          {
            id: "porte-monnaie",
            label: "Porte-monnaie",
            helper: "Petite maroquinerie",
            keywords: ["porte-monnaie", "portemonnaie", "porte monnaie"],
          },
        ],
      },
    ],
  },
  {
    slugs: ["lifestyle-accessoires-cheveux"],
    groups: [
      {
        paramName: "type",
        title: "Type",
        options: [
          {
            id: "mini-pinces",
            label: "Mini pinces",
            helper: "Petit format",
            keywords: ["mini-pince", "mini pince", "minipince"],
          },
          {
            id: "pinces",
            label: "Pinces",
            helper: "Grandes pinces",
            keywords: ["pince"],
          },
          {
            id: "barrettes",
            label: "Barrettes",
            helper: "Barrettes cheveux",
            keywords: ["barrette"],
          },
        ],
      },
    ],
  },
  {
    slugs: ["lifestyle-foulards-bandeaux"],
    groups: [
      {
        paramName: "type",
        title: "Type",
        options: [
          {
            id: "carres-50",
            label: "Carrés 50×50",
            helper: "Carrés de soie",
            keywords: ["50x50", "50×50", "carre"],
          },
          {
            id: "foulards-100",
            label: "Foulards 100×100",
            helper: "Grand format",
            keywords: ["100x100", "100×100", "foulard"],
          },
          {
            id: "bandeaux",
            label: "Bandeaux",
            helper: "Bandeaux de soie",
            keywords: ["bandeau"],
          },
        ],
      },
    ],
  },
  {
    slugs: ["decoration-maison-murale"],
    groups: [
      {
        paramName: "type",
        title: "Type",
        options: [
          {
            id: "affiches",
            label: "Affiches",
            helper: "Impressions & posters",
            keywords: ["affiche", "poster"],
          },
          {
            id: "plaques",
            label: "Plaques décoratives",
            helper: "Plaques & pancartes",
            keywords: ["plaque"],
          },
          {
            id: "objets",
            label: "Objets muraux",
            helper: "Objets déco murale",
            keywords: ["objet mural", "objet"],
          },
        ],
      },
    ],
  },
];

/**
 * Retrouve la config de filtres applicable à une catégorie (via son propre
 * slug ou celui de sa catégorie parente). Renvoie `null` si la catégorie
 * n'a pas de filtre "Type" dédié (elle aura quand même Marque + Prix).
 */
export function getCategoryFilterConfig(category: {
  slug: string;
  parent?: { slug: string } | null;
}): CategoryFilterConfig | null {
  return (
    CATEGORY_FILTER_CONFIGS.find((config) => {
      if (config.slugs.includes(category.slug)) return true;
      if (
        category.parent?.slug &&
        config.slugs.includes(category.parent.slug)
      ) {
        return true;
      }
      return false;
    }) ?? null
  );
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesKeyword(source: string, keyword: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegExp(normalize(keyword))}\\b`);
  return pattern.test(source);
}

/**
 * Devine la valeur d'un groupe de filtre (ex. le type de bijou) pour un
 * produit donné, à partir de son nom et de ses tags. Les mots-clés les plus
 * longs sont testés en premier, pour éviter qu'un mot-clé générique (ex.
 * "pince") ne masque un mot-clé plus précis (ex. "mini pince").
 */
export function detectGroupValue(
  product: { name: string; tags: string[] },
  group: FilterGroupConfig,
): string | null {
  const source = normalize(`${product.name} ${product.tags.join(" ")}`);
  const sortedOptions = [...group.options].sort((a, b) => {
    const aMax = Math.max(...a.keywords.map((k) => k.length));
    const bMax = Math.max(...b.keywords.map((k) => k.length));
    return bMax - aMax;
  });

  for (const option of sortedOptions) {
    if (option.keywords.some((keyword) => matchesKeyword(source, keyword))) {
      return option.id;
    }
  }
  return null;
}
