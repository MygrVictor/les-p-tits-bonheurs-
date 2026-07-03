export type MenuLink = {
  label: string;
  href: string;
};

export type MenuSection = {
  title: string;
  links: MenuLink[];
};

export type MainMenuItem = MenuLink & {
  sections?: MenuSection[];
};

export const storefrontMainMenu: MainMenuItem[] = [
  {
    label: "Bijoux",
    href: "/categorie/bijoux",
    sections: [
      {
        title: "Acier inoxydable",
        links: [
          { label: "Voir toute la collection", href: "/categorie/bijoux" },
          { label: "ZAG Bijoux", href: "/categorie/bijoux" },
          { label: "Notre sélection acier", href: "/categorie/bijoux" },
          { label: "Guide des pierres", href: "/categorie/bijoux" },
          { label: "Marques", href: "/categorie/bijoux" },
          { label: "ZAG Bijoux", href: "/categorie/bijoux" },
          { label: "Notre sélection acier", href: "/categorie/bijoux" },
        ],
      },
      {
        title: "Plaqué or",
        links: [
          { label: "Voir toute la collection", href: "/categorie/bijoux" },
          { label: "LA2L", href: "/categorie/bijoux" },
          { label: "Au Fil de l'Eau", href: "/categorie/bijoux" },
          { label: "Mya Bay", href: "/categorie/bijoux" },
          { label: "Chloé Lou", href: "/categorie/bijoux" },
          { label: "Mayaaz", href: "/categorie/bijoux" },
          { label: "Habaha", href: "/categorie/bijoux" },
          { label: "Guide des pierres", href: "/categorie/bijoux" },
          { label: "Marques", href: "/categorie/bijoux" },
          { label: "LA2L", href: "/categorie/bijoux" },
          { label: "Au Fil de l'Eau", href: "/categorie/bijoux" },
          { label: "Mya Bay", href: "/categorie/bijoux" },
          { label: "Chloé Lou", href: "/categorie/bijoux" },
          { label: "Mayaaz", href: "/categorie/bijoux" },
          { label: "Habaha", href: "/categorie/bijoux" },
        ],
      },
    ],
  },
  {
    label: "Perlerie",
    href: "/categorie/perlerie",
    sections: [
      {
        title: "Perlerie",
        links: [
          { label: "Voir toute la collection", href: "/categorie/perlerie" },
          { label: "Perles", href: "/categorie/perlerie" },
          { label: "Charms", href: "/categorie/perlerie" },
          { label: "Apprêts", href: "/categorie/perlerie" },
          { label: "Chaînes", href: "/categorie/perlerie" },
          { label: "Fils", href: "/categorie/perlerie" },
          { label: "Outils", href: "/categorie/perlerie" },
          { label: "Kits DIY", href: "/categorie/perlerie" },
          { label: "Tutoriels", href: "/categorie/perlerie" },
        ],
      },
    ],
  },
  {
    label: "DIY & Loisirs créatifs",
    href: "/categorie/diy-loisirs-creatifs",
    sections: [
      {
        title: "Marques",
        links: [
          {
            label: "La Petite Épicerie",
            href: "/categorie/diy-loisirs-creatifs",
          },
          { label: "Djeco", href: "/categorie/diy-loisirs-creatifs" },
          { label: "Piece & Love", href: "/categorie/diy-loisirs-creatifs" },
          { label: "Piecely", href: "/categorie/diy-loisirs-creatifs" },
          {
            label: "All The Way To Say",
            href: "/categorie/diy-loisirs-creatifs",
          },
        ],
      },
    ],
  },
  {
    label: "Lifestyle",
    href: "/categorie/lifestyle",
    sections: [
      {
        title: "Lunettes",
        links: [{ label: "Charlie Therapy", href: "/categorie/lifestyle" }],
      },
      {
        title: "Foulards",
        links: [
          { label: "Bellemme", href: "/categorie/lifestyle" },
          { label: "Les Belles Vagabondes", href: "/categorie/lifestyle" },
        ],
      },
      {
        title: "Accessoires",
        links: [{ label: "Coucou Suzette", href: "/categorie/lifestyle" }],
      },
      {
        title: "Maroquinerie",
        links: [
          { label: "Hindbag", href: "/categorie/lifestyle" },
          { label: "Récitem", href: "/categorie/lifestyle" },
          { label: "Paul Marius", href: "/categorie/lifestyle" },
        ],
      },
      {
        title: "Sacs",
        links: [{ label: "Crazy Lou", href: "/categorie/lifestyle" }],
      },
    ],
  },
  {
    label: "Décoration & Maison",
    href: "/categorie/decoration-et-maison",
    sections: [
      {
        title: "Art de la table",
        links: [{ label: "Rice", href: "/categorie/decoration-et-maison" }],
      },
      {
        title: "Décoration",
        links: [
          {
            label: "Studio Roof",
            href: "/categorie/decoration-et-maison",
          },
          { label: "Kencre", href: "/categorie/decoration-et-maison" },
          {
            label: "All The Way To Say",
            href: "/categorie/decoration-et-maison",
          },
        ],
      },
      {
        title: "Gourdes & isothermes",
        links: [
          { label: "Letterbox", href: "/categorie/decoration-et-maison" },
        ],
      },
    ],
  },
  {
    label: "Papeterie",
    href: "/categorie/papeterie",
    sections: [
      {
        title: "Marques",
        links: [
          { label: "All The Way To Say", href: "/categorie/papeterie" },
          { label: "Carte d'Art", href: "/categorie/papeterie" },
        ],
      },
    ],
  },
  { label: "Acheter par couleur", href: "/categorie/couleurs" },
  { label: "Coups de cœur Pauline", href: "/categorie/coups-de-coeur" },
];
