"use client";

import { useState } from "react";
import { ShoppingBag, Minus, Plus, Check } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/lib/catalog";

export function AddToCartActions({
  productId,
  name,
  price,
  salePrice,
  image,
  stock,
}: Readonly<{
  productId: string;
  name: string;
  price: number;
  salePrice: number | null;
  image: string;
  stock: number;
}>) {
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = stock <= 0;
  const maxQty = Math.max(1, Math.min(stock || 1, 20));

  const handleAdd = () => {
    if (outOfStock) return;

    const product: Product = {
      id: productId,
      name,
      description: "",
      price,
      salePrice: salePrice ?? null,
      brandId: "",
      categoryId: "",
      images: image ? [image] : [],
      stock,
      status: "active",
      isNew: false,
      tags: [],
      variants: [],
      stones: [],
    };

    addItem(product, null, qty);
    setAdded(true);
    setQty(1);
    window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-full border border-neutral-200 px-1 py-1">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={outOfStock}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-neutral-50 disabled:opacity-40"
          aria-label="Diminuer la quantité"
        >
          <Minus size={14} />
        </button>
        <span className="min-w-[1.75rem] text-center text-sm font-semibold text-ink">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
          disabled={outOfStock}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-neutral-50 disabled:opacity-40"
          aria-label="Augmenter la quantité"
        >
          <Plus size={14} />
        </button>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {added ? <Check size={16} /> : <ShoppingBag size={16} />}
        {outOfStock
          ? "Rupture de stock"
          : added
            ? "Ajouté au panier !"
            : "Ajouter au panier"}
      </button>
      {!outOfStock && stock <= 5 && (
        <span className="text-xs font-semibold text-amber-600">
          Plus que {stock} en stock
        </span>
      )}
    </div>
  );
}
