"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore, selectCartCount, selectCartTotal } from "@/lib/cart-store";

export function CartDrawer({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const itemCount = useCartStore(selectCartCount);
  const cartTotal = useCartStore(selectCartTotal);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <aside className="relative flex w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-ink" />
            <h2 className="font-serif text-xl text-ink">
              Panier
              {itemCount > 0 && (
                <span className="ml-2 text-sm font-normal text-neutral-500">
                  ({itemCount} article{itemCount > 1 ? "s" : ""})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <ShoppingBag size={48} className="text-neutral-200" />
              <p className="text-sm text-neutral-500">Votre panier est vide</p>
              <button
                onClick={onClose}
                className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white"
              >
                Continuer mes achats
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 rounded-2xl bg-blush-50 p-3">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="h-full w-full bg-blush-100" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="text-sm font-semibold text-ink leading-tight">
                      {item.productName}
                    </p>
                    {item.variantLabel && (
                      <p className="text-xs text-neutral-500">{item.variantLabel}</p>
                    )}
                    <p className="text-sm font-semibold text-blush-700">
                      {(item.price * item.quantity).toFixed(2)} €
                    </p>
                    <div className="mt-auto flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-ink hover:bg-neutral-50"
                        aria-label="Diminuer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold text-ink">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-ink hover:bg-neutral-50"
                        aria-label="Augmenter"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-neutral-400 hover:text-red-500"
                        aria-label="Supprimer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-neutral-100 px-6 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Sous-total</span>
              <span className="font-semibold text-ink">{cartTotal.toFixed(2)} €</span>
            </div>
            <p className="text-xs text-neutral-400">
              Livraison calculée à l’étape suivante
            </p>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full rounded-full bg-ink py-3.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
            >
              Commander — {cartTotal.toFixed(2)} €
            </Link>
            <Link
              href="/panier"
              onClick={onClose}
              className="block w-full rounded-full border border-ink/15 bg-white py-3 text-center text-sm font-semibold text-ink transition hover:bg-blush-50"
            >
              Voir le panier
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
