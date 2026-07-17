"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/lib/catalog";

type QuickAddProduct = Pick<
  Product,
  | "id"
  | "name"
  | "description"
  | "price"
  | "salePrice"
  | "brandId"
  | "categoryId"
  | "images"
  | "stock"
  | "status"
  | "isNew"
  | "tags"
  | "variants"
  | "stones"
>;

export function QuickAddToCart({
  product,
  compact = false,
}: Readonly<{
  product: QuickAddProduct;
  compact?: boolean;
}>) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (outOfStock) return;
    addItem(product, null, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={outOfStock}
      className={
        compact
          ? "inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          : "inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      }
      aria-label={
        outOfStock ? "Produit en rupture" : "Ajouter ce produit au panier"
      }
    >
      {compact ? (
        added ? (
          <>
            <Check size={14} />
            Ajouté
          </>
        ) : outOfStock ? (
          <>
            <ShoppingBag size={14} />
            Rupture
          </>
        ) : (
          <>
            <ShoppingBag size={14} />
            Panier
          </>
        )
      ) : (
        <>
          {added ? <Check size={14} /> : <ShoppingBag size={14} />}
          {outOfStock ? "Rupture" : added ? "Ajouté" : "Panier"}
        </>
      )}
    </button>
  );
}
