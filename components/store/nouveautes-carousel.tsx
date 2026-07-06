import { ProductCarousel } from "@/components/store/product-carousel";
import { getNewArrivals } from "@/lib/storefront";

export async function NouveautesCarousel() {
  const products = await getNewArrivals(12);

  return (
    <ProductCarousel
      kicker="✦ Dernières arrivées"
      title="Nouveautés"
      viewAllHref="/nouveautes"
      products={products}
      emptyMessage="Ajoute des produits actifs marqués « Nouveau » depuis l'admin pour remplir cette section."
    />
  );
}
