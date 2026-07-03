export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  categoryIds: string[];
};

export type Stone = {
  id: string;
  productId: string;
  name: string;
  color: string;
  virtues: string;
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: string;
  value: string;
  stock: number;
  price?: number | null;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number | null;
  brandId: string;
  categoryId: string;
  subCategoryId?: string | null;
  images: string[];
  stock: number;
  status: "active" | "inactive" | "new";
  isNew: boolean;
  tags: string[];
  featured?: boolean;
  variants: ProductVariant[];
  stones: Stone[];
};

export const categoryMenu = [
  "Bijoux",
  "Perlerie",
  "DIY & Loisirs créatifs",
  "Lifestyle",
  "Mode et Accessoires",
  "Décoration et maison",
  "Loisir créatif et Puzzles",
  "Papeterie",
  "Idées cadeaux",
  "Acheter par couleur",
  "Coups de cœur Pauline",
  "Sac et petite maroquinerie",
];

export const subCategoriesByCategory: Record<string, string[]> = {
  bijoux: ["Collier", "Bracelet", "Boucles d’oreilles"],
  perlerie: [
    "Perles",
    "Charms",
    "Apprêts",
    "Chaînes",
    "Fils",
    "Outils",
    "Kits DIY",
    "Tutoriels",
  ],
  "diy-loisirs-creatifs": ["Kits DIY", "Loisirs créatifs", "Puzzles"],
  lifestyle: ["Lunettes", "Foulards", "Accessoires", "Maroquinerie", "Sacs"],
  "mode-et-accessoires": [
    "Charly Therapy",
    "Bellentine",
    "Les belles vagabondes",
    "Coucou Suzette",
    "Dragonne Téléphones",
    "Portes-clés",
  ],
  "decoration-et-maison": [
    "Vaisselles Rices",
    "Studio Roof",
    "Affiches Kénore",
    "All the way to say",
    "Tasses",
  ],
  "loisir-creatif-et-puzzles": [
    "Carnets aquarellés",
    "Petit pinceau",
    "Pastel au numéro",
    "Diamond painting",
    "Puzzle",
    "Kit bijoux",
    "Djeco",
  ],
  papeterie: ["Carnet ligné", "Carnet à dessin", "Notes fléchées", "Humours"],
  "idees-cadeaux": ["Sélection cadeaux", "Petits prix", "Best sellers"],
  couleurs: ["Rose", "Vert", "Bleu", "Doré", "Multicolore"],
  "coups-de-coeur": ["Sélection Pauline"],
  "sac-et-petite-maroquinerie": [
    "Paul Marcus",
    "Hindbag",
    "Reaitem",
    "Crazy Lou",
    "Petit maroquinerie",
  ],
};

export const categories: Category[] = [
  { id: "cat-bijoux", name: "Bijoux", slug: "bijoux" },
  { id: "cat-perlerie", name: "Perlerie", slug: "perlerie" },
  {
    id: "cat-diy",
    name: "DIY & Loisirs créatifs",
    slug: "diy-loisirs-creatifs",
  },
  { id: "cat-lifestyle", name: "Lifestyle", slug: "lifestyle" },
  { id: "cat-mode", name: "Mode et Accessoires", slug: "mode-et-accessoires" },
  {
    id: "cat-deco",
    name: "Décoration et maison",
    slug: "decoration-et-maison",
  },
  {
    id: "cat-loisir",
    name: "Loisir créatif et Puzzles",
    slug: "loisir-creatif-et-puzzles",
  },
  { id: "cat-papeterie", name: "Papeterie", slug: "papeterie" },
  {
    id: "cat-idees-cadeaux",
    name: "Idées cadeaux",
    slug: "idees-cadeaux",
  },
  {
    id: "cat-couleurs",
    name: "Acheter par couleur",
    slug: "couleurs",
  },
  {
    id: "cat-coups-coeur",
    name: "Coups de cœur Pauline",
    slug: "coups-de-coeur",
  },
  {
    id: "cat-sac",
    name: "Sac et petite maroquinerie",
    slug: "sac-et-petite-maroquinerie",
  },
];

export const brands: Brand[] = [
  {
    id: "brand-zag",
    name: "Zag Bijoux",
    slug: "zag-bijoux",
    categoryIds: ["cat-bijoux"],
  },
  {
    id: "brand-la2l",
    name: "LA2L",
    slug: "la2l",
    categoryIds: ["cat-bijoux"],
  },
  {
    id: "brand-au-fil-de-leau",
    name: "Au Fil de l'Eau",
    slug: "au-fil-de-leau",
    categoryIds: ["cat-bijoux"],
  },
  {
    id: "brand-mya-bay",
    name: "Mya Bay",
    slug: "mya-bay",
    categoryIds: ["cat-bijoux"],
  },
  {
    id: "brand-chloe-lou",
    name: "Chloé Lou",
    slug: "chloe-lou",
    categoryIds: ["cat-bijoux"],
  },
  {
    id: "brand-mayaaz",
    name: "Mayaaz",
    slug: "mayaaz",
    categoryIds: ["cat-bijoux"],
  },
  {
    id: "brand-habaha",
    name: "Habaha",
    slug: "habaha",
    categoryIds: ["cat-bijoux"],
  },
  {
    id: "brand-ambre",
    name: "Ambre Atelier",
    slug: "ambre-atelier",
    categoryIds: ["cat-bijoux"],
  },
  {
    id: "brand-charly",
    name: "Charly Therapy",
    slug: "charly-therapy",
    categoryIds: ["cat-mode"],
  },
  {
    id: "brand-bellentine",
    name: "Bellentine",
    slug: "bellentine",
    categoryIds: ["cat-mode"],
  },
  {
    id: "brand-rices",
    name: "Vaisselles Rices",
    slug: "vaisselles-rices",
    categoryIds: ["cat-deco"],
  },
  {
    id: "brand-studioroof",
    name: "Studio Roof",
    slug: "studio-roof",
    categoryIds: ["cat-deco"],
  },
  {
    id: "brand-djeco",
    name: "Djeco",
    slug: "djeco",
    categoryIds: ["cat-loisir", "cat-diy"],
  },
  {
    id: "brand-la-petite-epicerie",
    name: "La Petite Épicerie",
    slug: "la-petite-epicerie",
    categoryIds: ["cat-diy"],
  },
  {
    id: "brand-piece-love",
    name: "Piece & Love",
    slug: "piece-love",
    categoryIds: ["cat-diy"],
  },
  {
    id: "brand-piecely",
    name: "Piecely",
    slug: "piecely",
    categoryIds: ["cat-diy"],
  },
  {
    id: "brand-all-the-way-to-say",
    name: "All The Way To Say",
    slug: "all-the-way-to-say",
    categoryIds: ["cat-diy", "cat-deco", "cat-papeterie"],
  },
  {
    id: "brand-charlie-therapy",
    name: "Charlie Therapy",
    slug: "charlie-therapy",
    categoryIds: ["cat-lifestyle"],
  },
  {
    id: "brand-bellemme",
    name: "Bellemme",
    slug: "bellemme",
    categoryIds: ["cat-lifestyle"],
  },
  {
    id: "brand-les-belles-vagabondes",
    name: "Les Belles Vagabondes",
    slug: "les-belles-vagabondes",
    categoryIds: ["cat-lifestyle"],
  },
  {
    id: "brand-coucou-suzette",
    name: "Coucou Suzette",
    slug: "coucou-suzette",
    categoryIds: ["cat-lifestyle"],
  },
  {
    id: "brand-recitem",
    name: "Récitem",
    slug: "recitem",
    categoryIds: ["cat-lifestyle"],
  },
  {
    id: "brand-paul-marius",
    name: "Paul Marius",
    slug: "paul-marius",
    categoryIds: ["cat-lifestyle"],
  },
  {
    id: "brand-crazy-lou",
    name: "Crazy Lou",
    slug: "crazy-lou",
    categoryIds: ["cat-lifestyle"],
  },
  {
    id: "brand-rice",
    name: "Rice",
    slug: "rice",
    categoryIds: ["cat-deco"],
  },
  {
    id: "brand-kencre",
    name: "Kencre",
    slug: "kencre",
    categoryIds: ["cat-deco"],
  },
  {
    id: "brand-letterbox",
    name: "Letterbox",
    slug: "letterbox",
    categoryIds: ["cat-deco"],
  },
  {
    id: "brand-papeterie",
    name: "Papeterie créative",
    slug: "papeterie-creative",
    categoryIds: ["cat-papeterie"],
  },
  {
    id: "brand-hindbag",
    name: "Hindbag",
    slug: "hindbag",
    categoryIds: ["cat-sac"],
  },
  {
    id: "brand-paul-marcus",
    name: "Paul Marcus",
    slug: "paul-marcus",
    categoryIds: ["cat-sac"],
  },
  {
    id: "brand-carte-dart",
    name: "Carte d'Art",
    slug: "carte-dart",
    categoryIds: ["cat-papeterie"],
  },
];

export const stones: Stone[] = [
  {
    id: "stone-1",
    productId: "product-1",
    name: "Quartz rose",
    color: "#f3c4d1",
    virtues: "Douceur, amour de soi, énergie apaisante",
  },
  {
    id: "stone-2",
    productId: "product-2",
    name: "Aventurine",
    color: "#84c59a",
    virtues: "Chance, optimisme, équilibre émotionnel",
  },
  {
    id: "stone-3",
    productId: "product-3",
    name: "Lapis-lazuli",
    color: "#2e4f9a",
    virtues: "Intuition, confiance, clarté mentale",
  },
  {
    id: "stone-4",
    productId: "product-4",
    name: "Améthyste",
    color: "#8d70c7",
    virtues: "Sérénité, protection, recentrage",
  },
];

export const products: Product[] = [
  {
    id: "product-1",
    name: "Collier Choker Quartz",
    description:
      "Collier ras-du-cou délicat en acier doré avec quartz rose, pour une allure féminine et lumineuse.",
    price: 42,
    salePrice: 36,
    brandId: "brand-zag",
    categoryId: "cat-bijoux",
    subCategoryId: "bijoux-collier",
    images: [
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80",
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&q=80",
    ],
    stock: 12,
    status: "new",
    isNew: true,
    tags: ["quartz", "rose", "choker", "gold"],
    featured: true,
    variants: [
      {
        id: "variant-1a",
        productId: "product-1",
        name: "Taille",
        value: "38 cm",
        stock: 6,
        price: 36,
      },
      {
        id: "variant-1b",
        productId: "product-1",
        name: "Taille",
        value: "42 cm",
        stock: 6,
        price: 36,
      },
    ],
    stones: [stones[0]],
  },
  {
    id: "product-2",
    name: "Bracelet Multi-rangs Aventurine",
    description:
      "Bracelet multi-rangs avec pierre verte et finitions dorées. Élégant au quotidien.",
    price: 48,
    brandId: "brand-ambre",
    categoryId: "cat-bijoux",
    subCategoryId: "bijoux-bracelet",
    images: [
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=80",
    ],
    stock: 8,
    status: "active",
    isNew: false,
    tags: ["aventurine", "bracelet", "multi-rangs"],
    featured: true,
    variants: [
      {
        id: "variant-2a",
        productId: "product-2",
        name: "Taille",
        value: "S/M",
        stock: 4,
        price: 48,
      },
      {
        id: "variant-2b",
        productId: "product-2",
        name: "Taille",
        value: "M/L",
        stock: 4,
        price: 48,
      },
    ],
    stones: [stones[1]],
  },
  {
    id: "product-3",
    name: "Boucles d’oreilles Longues Lapis",
    description:
      "Boucles longues et graphiques, parfaites pour un look raffiné.",
    price: 58,
    brandId: "brand-zag",
    categoryId: "cat-bijoux",
    subCategoryId: "bijoux-boucles",
    images: [
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=1200&q=80",
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80",
    ],
    stock: 5,
    status: "active",
    isNew: false,
    tags: ["lapis", "boucles", "longues"],
    featured: false,
    variants: [
      {
        id: "variant-3a",
        productId: "product-3",
        name: "Finition",
        value: "Doré",
        stock: 3,
        price: 58,
      },
      {
        id: "variant-3b",
        productId: "product-3",
        name: "Finition",
        value: "Argenté",
        stock: 2,
        price: 58,
      },
    ],
    stones: [stones[2]],
  },
  {
    id: "product-4",
    name: "Ear cuff Améthyste",
    description: "Ear cuff minimaliste avec pierre violette, sans perçage.",
    price: 29,
    brandId: "brand-ambre",
    categoryId: "cat-bijoux",
    subCategoryId: "bijoux-boucles",
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=80",
    ],
    stock: 18,
    status: "active",
    isNew: true,
    tags: ["améthyste", "ear cuff", "pierres"],
    featured: false,
    variants: [],
    stones: [stones[3]],
  },
  {
    id: "product-5",
    name: "Tote bag Hindbag",
    description:
      "Sac élégant et pratique pour le quotidien, matière responsable.",
    price: 52,
    brandId: "brand-hindbag",
    categoryId: "cat-sac",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80",
    ],
    stock: 7,
    status: "active",
    isNew: false,
    tags: ["sac", "tote", "responsable"],
    featured: true,
    variants: [
      {
        id: "variant-5a",
        productId: "product-5",
        name: "Couleur",
        value: "Terracotta",
        stock: 3,
        price: 52,
      },
    ],
    stones: [],
  },
  {
    id: "product-6",
    name: "Plateau Studio Roof",
    description: "Objet déco graphique pour maison lumineuse et contemporaine.",
    price: 34,
    brandId: "brand-studioroof",
    categoryId: "cat-deco",
    images: [
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=1200&q=80",
    ],
    stock: 11,
    status: "active",
    isNew: false,
    tags: ["déco", "maison", "plateau"],
    featured: false,
    variants: [],
    stones: [],
  },
  {
    id: "product-7",
    name: "Carnet aquarellé",
    description:
      "Carnet illustré pour croquis, aquarelle légère et notes créatives.",
    price: 19,
    brandId: "brand-papeterie",
    categoryId: "cat-papeterie",
    images: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&q=80",
    ],
    stock: 25,
    status: "active",
    isNew: true,
    tags: ["carnet", "aquarelle", "papeterie"],
    featured: true,
    variants: [],
    stones: [],
  },
  {
    id: "product-8",
    name: "Puzzle 1000 pièces Djeco",
    description: "Puzzle créatif et poétique, à offrir ou à s’offrir.",
    price: 26,
    brandId: "brand-djeco",
    categoryId: "cat-loisir",
    images: [
      "https://images.unsplash.com/photo-1560233067-13ff8d1d9b77?w=1200&q=80",
    ],
    stock: 4,
    status: "active",
    isNew: false,
    tags: ["puzzle", "djeco", "loisir"],
    featured: false,
    variants: [],
    stones: [],
  },
];

export const stats = {
  totalProducts: products.length,
  recentOrders: [
    {
      id: "CMD-2026-001",
      date: "04/06/2026",
      customer: "Élise M.",
      total: 92,
      status: "Confirmée",
    },
    {
      id: "CMD-2026-002",
      date: "03/06/2026",
      customer: "Sarah L.",
      total: 58,
      status: "En attente",
    },
    {
      id: "CMD-2026-003",
      date: "02/06/2026",
      customer: "Camille D.",
      total: 126,
      status: "Expédiée",
    },
  ],
  lowStock: products.filter((product) => product.stock <= 5),
  monthlyRevenue: 1860,
};

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getBrandById(id: string) {
  return brands.find((brand) => brand.id === id);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

export function getProductsByCategorySlug(slug: string) {
  const category = getCategoryBySlug(slug);
  if (!category) {
    return [];
  }
  return products.filter((product) => product.categoryId === category.id);
}

export function getFeaturedProducts() {
  return products.filter((product) => product.featured);
}

export function getProductsByStoneName(name: string) {
  return products.filter((product) =>
    product.stones.some((stone) =>
      stone.name.toLowerCase().includes(name.toLowerCase()),
    ),
  );
}
