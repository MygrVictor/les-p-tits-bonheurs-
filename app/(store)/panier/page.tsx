"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import {
  useCartStore,
  selectCartCount,
  selectCartTotal,
} from "@/lib/cart-store";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const itemCount = useCartStore(selectCartCount);
  const cartTotal = useCartStore(selectCartTotal);

  if (items.length === 0) {
    return (
      <section className="space-y-6">
        <h1 className="font-serif text-4xl text-ink">Panier</h1>
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-16 text-center shadow-soft">
          <ShoppingBag size={48} className="text-neutral-200" />
          <p className="text-sm text-neutral-500">Votre panier est vide.</p>
          <Link
            href="/"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Découvrir la boutique
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl text-ink">
        Panier
        <span className="ml-3 text-base font-normal text-neutral-500">
          ({itemCount} article{itemCount > 1 ? "s" : ""})
        </span>
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-3xl bg-white p-4 shadow-soft sm:p-5"
            >
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-blush-50 sm:h-28 sm:w-24">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="h-full w-full bg-blush-100" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <p className="font-serif text-lg leading-tight text-ink">
                  {item.productName}
                </p>
                {item.variantLabel && (
                  <p className="text-xs text-neutral-500">
                    {item.variantLabel}
                  </p>
                )}
                <p className="text-base font-semibold text-blush-700">
                  {(item.price * item.quantity).toFixed(2)} €
                  <span className="ml-2 text-xs font-normal text-neutral-400">
                    ({item.price.toFixed(2)} € / unité)
                  </span>
                </p>
                <div className="mt-auto flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-ink hover:bg-neutral-50"
                    aria-label="Diminuer"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="min-w-[1.5rem] text-center text-sm font-semibold text-ink">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-ink hover:bg-neutral-50"
                    aria-label="Augmenter"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-auto flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-red-500"
                    aria-label="Supprimer"
                  >
                    <X size={14} />
                    Retirer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="font-serif text-xl text-ink">Résumé</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Sous-total</span>
            <span className="font-semibold text-ink">
              {cartTotal.toFixed(2)} €
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Livraison calculée à l’étape suivante.
          </p>
          <Link
            href="/checkout"
            className="block w-full rounded-full bg-ink py-3.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
          >
            Passer commande — {cartTotal.toFixed(2)} €
          </Link>
          <Link
            href="/"
            className="block w-full rounded-full border border-ink/15 bg-white py-3 text-center text-sm font-semibold text-ink transition hover:bg-blush-50"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    </section>
  );
}
