import { ProductGrid } from "@/components/store/product-grid";
import { getFeaturedStoreProducts } from "@/lib/storefront";

export async function FeaturedGrid() {
  const products = await getFeaturedStoreProducts(8);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
          Sélection
        </p>
        <h2 className="font-serif text-3xl text-ink">Les coups de cœur</h2>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}
