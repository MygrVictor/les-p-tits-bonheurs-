export type NewBrand = {
  /** Identifiant unique et stable (utilisé comme clé React). */
  id: string;
  /** Nom affiché sur l'image. */
  name: string;
  /** Petite accroche optionnelle sous le nom (ex. type de produit). */
  tagline?: string;
  /** Chemin de l'image (dans /public) ou URL complète. */
  image: string;
  /** Lien au clic — en général la catégorie ou le filtre marque associé. */
  href: string;
};

/**
 * Marques mises en avant dans le bandeau « Nouveautés » de la page
 * d'accueil (grand carrousel, 3 images côte à côte par slide).
 *
 * ⚠️ À MODIFIER RÉGULIÈREMENT : c'est ici qu'on ajoute/retire/remplace les
 * nouvelles marques du moment. Pas besoin de toucher au reste du code.
 *
 * Pour changer une marque :
 *   1. Dépose la nouvelle photo dans /public (ex. /ma-marque.jpg)
 *   2. Modifie ou ajoute une entrée ci-dessous
 *   3. Le lien "href" doit pointer vers la catégorie où trouver ses
 *      produits (voir lib/menu.ts pour la liste des URLs de catégories)
 *
 * S'il y a 1 ou 2 marques seulement, le carrousel affiche simplement ce
 * qu'il y a (pas besoin d'en avoir toujours 3). Au-delà de 3, elles sont
 * automatiquement réparties sur plusieurs slides.
 */
export const newBrands: NewBrand[] = [
  {
    id: "charly-therapy",
    name: "Charly Therapy",
    tagline: "Lunettes de soleil",
    image: "/charly-therapy.jpg",
    href: "/categorie/lifestyle",
  },
  {
    id: "zag-bijoux",
    name: "Zag Bijoux",
    tagline: "Bijoux en acier doré",
    image: "/zag-bijoux.jpg",
    href: "/categorie/bijouterie",
  },
];
