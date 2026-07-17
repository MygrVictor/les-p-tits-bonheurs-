export type NewBrand = {
  /** Identifiant unique et stable (utilisé comme clé React). */
  id: string;
  /** Nom affiché sous les photos. */
  name: string;
  /** Petite accroche optionnelle sous le nom (ex. type de produit). */
  tagline?: string;
  /** Les 3 photos de la marque (dans /public) ou URLs complètes. */
  images: string[];
  /** Lien au clic — en général la catégorie ou le filtre marque associé. */
  href: string;
};

/**
 * Marques mises en avant dans le bandeau « Nouveautés » de la page
 * d'accueil (grand carrousel). Chaque marque = 1 slide avec SES 3 photos
 * côte à côte. Quand on fait défiler, la marque suivante arrive avec ses
 * propres 3 photos.
 *
 * ⚠️ À MODIFIER RÉGULIÈREMENT : c'est ici qu'on ajoute/retire/remplace les
 * nouvelles marques du moment. Pas besoin de toucher au reste du code.
 *
 * Pour changer une marque :
 *   1. Dépose ses 3 nouvelles photos dans /public (ex. /ma-marque.jpg,
 *      /ma-marque2.jpg, /ma-marque3.jpg)
 *   2. Modifie ou ajoute une entrée ci-dessous avec ces 3 chemins dans
 *      "images"
 *   3. Le lien "href" doit pointer vers la catégorie où trouver ses
 *      produits (voir lib/menu.ts pour la liste des URLs de catégories)
 *
 * Le tableau "images" doit idéalement contenir exactement 3 photos (c'est
 * ce qui s'affiche côte à côte sur une slide). S'il y en a plus de 3,
 * seules les 3 premières sont utilisées.
 */
export const newBrands: NewBrand[] = [
  {
    id: "charly-therapy",
    name: "Charly Therapy",
    tagline: "Lunettes de soleil",
    images: [
      "/charly-therapy.jpg",
      "/charly-therapy2.jpg",
      "/charly-thérapy3.jpg",
    ],
    href: "/categorie/lifestyle",
  },
  {
    id: "zag-bijoux",
    name: "Zag Bijoux",
    tagline: "Bijoux en acier doré",
    images: ["/zag-bijoux.jpg", "/zag-bijoux2.jpg", "/zag-bijoux3.jpg"],
    href: "/categorie/bijouterie",
  },
];
