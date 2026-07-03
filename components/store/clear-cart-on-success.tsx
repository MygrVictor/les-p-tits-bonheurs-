"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/lib/cart-store";

/**
 * Vide le panier persisté (localStorage + store) une fois la commande
 * confirmée. Placé dans la page de confirmation, ne rend rien à l'écran.
 */
export function ClearCartOnSuccess() {
  const clearCart = useCartStore((s) => s.clearCart);
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;
    clearCart();
  }, [clearCart]);

  return null;
}
