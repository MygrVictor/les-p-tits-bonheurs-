import { products } from "@/lib/catalog";
import { ProductCard } from "@/components/store/product-card";

export function ProductGrid({
  products: inputProducts = products,
}: Readonly<{ products?: typeof products }>) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {inputProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
