import { ProductCarousel } from "@/components/store/product-carousel";
import { getFeaturedStoreProducts } from "@/lib/storefront";

export async function FeaturedGrid() {
  const products = await getFeaturedStoreProducts(12);

  return (
    <ProductCarousel
      kicker="✦ Sélection"
      title="Les coups de cœur"
      products={products}
      emptyMessage="Ajoute des produits actifs depuis l'admin pour remplir cette sélection."
    />
  );
}
