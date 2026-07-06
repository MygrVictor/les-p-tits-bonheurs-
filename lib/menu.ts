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

/**
 * Menu principal — organisé par familles de produits (juillet 2026).
 *
 * Important : les marques ne figurent JAMAIS ici. Elles sont proposées
 * uniquement via les filtres de chaque page catégorie (filtre « Marque »).
 * Ce fichier ne doit donc lister que des familles/types de produits.
 */
export const storefrontMainMenu: MainMenuItem[] = [
  {
    label: "Nouveautés",
    href: "/nouveautes",
  },
  {
    label: "Bijouterie",
    href: "/categorie/bijouterie",
    sections: [
      {
        title: "Acier inoxydable",
        links: [
          {
            label: "Voir tout",
            href: "/categorie/bijouterie-acier-inoxydable",
          },
          {
            label: "Boucles d'oreilles",
            href: "/categorie/bijouterie-acier-inoxydable?type=boucles",
          },
          {
            label: "Bracelets",
            href: "/categorie/bijouterie-acier-inoxydable?type=bracelet",
          },
          {
            label: "Colliers",
            href: "/categorie/bijouterie-acier-inoxydable?type=collier",
          },
          {
            label: "Bagues",
            href: "/categorie/bijouterie-acier-inoxydable?type=bagues",
          },
          {
            label: "Boîtes à bijoux",
            href: "/categorie/bijouterie-acier-inoxydable?type=boites",
          },
        ],
      },
      {
        title: "Plaqué Or",
        links: [
          { label: "Voir tout", href: "/categorie/bijouterie-plaque-or" },
          {
            label: "Boucles d'oreilles",
            href: "/categorie/bijouterie-plaque-or?type=boucles",
          },
          {
            label: "Bracelets",
            href: "/categorie/bijouterie-plaque-or?type=bracelet",
          },
          {
            label: "Colliers",
            href: "/categorie/bijouterie-plaque-or?type=collier",
          },
          {
            label: "Bagues",
            href: "/categorie/bijouterie-plaque-or?type=bagues",
          },
          {
            label: "Boîtes à bijoux",
            href: "/categorie/bijouterie-plaque-or?type=boites",
          },
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
          { label: "Voir tout", href: "/categorie/perlerie" },
          { label: "Perles", href: "/categorie/perlerie?type=perles" },
          { label: "Charms", href: "/categorie/perlerie?type=charms" },
          { label: "Apprêts", href: "/categorie/perlerie?type=apprets" },
          { label: "Chaînes", href: "/categorie/perlerie?type=chaines" },
          { label: "Fils", href: "/categorie/perlerie?type=fils" },
          { label: "Outils", href: "/categorie/perlerie?type=outils" },
          { label: "Kits DIY", href: "/categorie/perlerie?type=kits" },
        ],
      },
    ],
  },
  {
    label: "Jeux & DIY",
    href: "/categorie/jeux-diy",
    sections: [
      {
        title: "Puzzles",
        links: [
          {
            label: "100 pièces",
            href: "/categorie/jeux-diy-puzzles?pieces=100",
          },
          {
            label: "500 pièces",
            href: "/categorie/jeux-diy-puzzles?pieces=500",
          },
          {
            label: "1000 pièces",
            href: "/categorie/jeux-diy-puzzles?pieces=1000",
          },
          {
            label: "1500 pièces",
            href: "/categorie/jeux-diy-puzzles?pieces=1500",
          },
          {
            label: "Tapis de puzzle",
            href: "/categorie/jeux-diy-puzzles?type=tapis",
          },
        ],
      },
      {
        title: "Autres familles",
        links: [
          { label: "Jeux", href: "/categorie/jeux-diy-jeux" },
          {
            label: "Peinture au numéro",
            href: "/categorie/jeux-diy-peinture-au-numero",
          },
          {
            label: "Diamond Painting",
            href: "/categorie/jeux-diy-diamond-painting",
          },
          {
            label: "Carnets à aquarelle",
            href: "/categorie/jeux-diy-carnets-aquarelle",
          },
          { label: "Pastels", href: "/categorie/jeux-diy-pastels" },
          { label: "Kits DIY", href: "/categorie/jeux-diy-kits-diy" },
          { label: "Kits bijoux", href: "/categorie/jeux-diy-kits-bijoux" },
        ],
      },
    ],
  },
  {
    label: "Lifestyle",
    href: "/categorie/lifestyle",
    sections: [
      {
        title: "Maroquinerie",
        links: [
          {
            label: "Voir tout",
            href: "/categorie/lifestyle-maroquinerie",
          },
          {
            label: "Bananes",
            href: "/categorie/lifestyle-maroquinerie?type=bananes",
          },
          {
            label: "Sacs lune",
            href: "/categorie/lifestyle-maroquinerie?type=sacs-lune",
          },
          {
            label: "Sacs week-end",
            href: "/categorie/lifestyle-maroquinerie?type=sacs-week-end",
          },
          {
            label: "Porte-monnaie",
            href: "/categorie/lifestyle-maroquinerie?type=porte-monnaie",
          },
        ],
      },
      {
        title: "Accessoires cheveux",
        links: [
          {
            label: "Voir tout",
            href: "/categorie/lifestyle-accessoires-cheveux",
          },
          {
            label: "Pinces",
            href: "/categorie/lifestyle-accessoires-cheveux?type=pinces",
          },
          {
            label: "Mini pinces",
            href: "/categorie/lifestyle-accessoires-cheveux?type=mini-pinces",
          },
          {
            label: "Barrettes",
            href: "/categorie/lifestyle-accessoires-cheveux?type=barrettes",
          },
        ],
      },
      {
        title: "Foulards & Bandeaux",
        links: [
          {
            label: "Voir tout",
            href: "/categorie/lifestyle-foulards-bandeaux",
          },
          {
            label: "Carrés de soie 50×50",
            href: "/categorie/lifestyle-foulards-bandeaux?type=carres-50",
          },
          {
            label: "Foulards 100×100",
            href: "/categorie/lifestyle-foulards-bandeaux?type=foulards-100",
          },
          {
            label: "Bandeaux de soie",
            href: "/categorie/lifestyle-foulards-bandeaux?type=bandeaux",
          },
        ],
      },
      {
        title: "Autres familles",
        links: [
          { label: "Chaussettes", href: "/categorie/lifestyle-chaussettes" },
          { label: "Pin's", href: "/categorie/lifestyle-pins" },
          {
            label: "Trousses de toilette",
            href: "/categorie/lifestyle-trousses-toilette",
          },
        ],
      },
    ],
  },
  {
    label: "Décoration & Maison",
    href: "/categorie/decoration-maison",
    sections: [
      {
        title: "Univers",
        links: [
          {
            label: "Arts de la table",
            href: "/categorie/decoration-maison-arts-table",
          },
          { label: "Bougies", href: "/categorie/decoration-maison-bougies" },
        ],
      },
      {
        title: "Décoration murale",
        links: [
          {
            label: "Voir tout",
            href: "/categorie/decoration-maison-murale",
          },
          {
            label: "Affiches",
            href: "/categorie/decoration-maison-murale?type=affiches",
          },
          {
            label: "Objets muraux",
            href: "/categorie/decoration-maison-murale?type=objets",
          },
          {
            label: "Plaques décoratives",
            href: "/categorie/decoration-maison-murale?type=plaques",
          },
        ],
      },
    ],
  },
  {
    label: "Papeterie",
    href: "/categorie/papeterie",
  },
  { label: "Acheter par couleur", href: "/categorie/couleurs" },
  {
    label: "❤️ Les coups de cœur de Pauline",
    href: "/categorie/coups-de-coeur",
  },
];
