/**
 * Palette de couleurs utilisée pour l'attribut "Couleur" (optionnel) des
 * produits — permet à la catégorie transverse "Acheter par couleur"
 * (/categorie/couleurs) de proposer un vrai filtre par pastille, plutôt
 * qu'une catégorie vide comme c'était le cas jusqu'ici.
 *
 * Un produit ne peut avoir qu'UNE seule couleur ici (choix volontairement
 * simple pour l'admin) : pour un produit multicolore, choisis la couleur
 * dominante ou "Multicolore".
 *
 * Pour ajouter une couleur : ajoute une entrée avec un `id` unique
 * (utilisé tel quel en base et dans l'URL ?couleur=), un `label` affiché,
 * et un `hex` pour la pastille. Pas de migration nécessaire (le champ est
 * un simple texte libre en base), mais reste cohérent avec cette liste
 * pour que le filtre fonctionne.
 */
export type ProductColor = {
  id: string;
  label: string;
  hex: string;
};

export const PRODUCT_COLORS: ProductColor[] = [
  { id: "rouge", label: "Rouge", hex: "#D64545" },
  { id: "rose", label: "Rose", hex: "#E79EB0" },
  { id: "orange", label: "Orange", hex: "#E38B4B" },
  { id: "jaune", label: "Jaune", hex: "#E8C547" },
  { id: "vert", label: "Vert", hex: "#6FA582" },
  { id: "bleu", label: "Bleu", hex: "#4B7BA6" },
  { id: "violet", label: "Violet", hex: "#8D70C7" },
  { id: "blanc", label: "Blanc", hex: "#F7F4F1" },
  { id: "noir", label: "Noir", hex: "#2A2523" },
  { id: "gris", label: "Gris", hex: "#9C9490" },
  { id: "beige", label: "Beige", hex: "#D8C3A5" },
  { id: "marron", label: "Marron", hex: "#8B5E3C" },
  { id: "dore", label: "Doré", hex: "#C9A24B" },
  { id: "argente", label: "Argenté", hex: "#B9BEC4" },
  { id: "multicolore", label: "Multicolore", hex: "" },
];

export function getProductColor(
  id: string | null | undefined,
): ProductColor | null {
  if (!id) return null;
  return PRODUCT_COLORS.find((c) => c.id === id) ?? null;
}
