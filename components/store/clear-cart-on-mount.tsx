"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/cart-store";

/**
 * Vide le panier localStorage côté client une fois la commande confirmée
 * côté serveur (paiement Stripe réussi). Le panier étant persistant en
 * localStorage (zustand/persist), il ne peut être vidé que depuis le client.
 */
export function ClearCartOnMount() {
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
