"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: number;
}

/**
 * Wishlist partagée entre tous les boutons de la page : UNE requête
 * GET /api/wishlist, quel que soit le nombre de cartes produit affichées
 * (avant : une requête par carte, ce qui déclenchait le rate limit de
 * 20 req/min dès la 2e page catégorie consultée).
 * Contient les slugs ET les ids des produits favoris.
 */
let wishlistRequest: Promise<Set<string>> | null = null;
let wishlistLoadedAt = 0;
const WISHLIST_TTL_MS = 60_000;

function loadWishlist(): Promise<Set<string>> {
  if (!wishlistRequest || Date.now() - wishlistLoadedAt > WISHLIST_TTL_MS) {
    wishlistLoadedAt = Date.now();
    wishlistRequest = fetch("/api/wishlist")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: { product: { slug: string; id: string } }[] }) => {
        const keys = new Set<string>();
        for (const item of data.items ?? []) {
          keys.add(item.product.slug);
          keys.add(item.product.id);
        }
        return keys;
      })
      .catch(() => {
        wishlistRequest = null; // on retentera au prochain montage
        return new Set<string>();
      });
  }
  return wishlistRequest;
}

function updateCachedWishlist(productId: string, present: boolean) {
  if (!wishlistRequest) return;
  wishlistRequest = wishlistRequest.then((keys) => {
    const next = new Set(keys);
    if (present) next.add(productId);
    else next.delete(productId);
    return next;
  });
}

export function WishlistButton({
  productId,
  className = "",
  size = 18,
}: WishlistButtonProps) {
  const { data: session, status } = useSession();
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      wishlistRequest = null; // déconnexion : ne pas réutiliser la liste d'un autre compte
      return;
    }

    let cancelled = false;
    loadWishlist().then((keys) => {
      if (!cancelled) setInWishlist(keys.has(productId));
    });
    return () => {
      cancelled = true;
    };
  }, [status, productId]);

  const toggle = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (status !== "authenticated") {
        window.location.href = "/compte?tab=login";
        return;
      }

      setLoading(true);
      try {
        if (inWishlist) {
          const res = await fetch(
            `/api/wishlist?productId=${encodeURIComponent(productId)}`,
            { method: "DELETE" },
          );
          if (res.ok) {
            setInWishlist(false);
            updateCachedWishlist(productId, false);
          }
        } else {
          const res = await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
          if (res.ok) {
            setInWishlist(true);
            updateCachedWishlist(productId, true);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [inWishlist, productId, status],
  );

  if (!session && status !== "loading") {
    return (
      <button
        onClick={toggle}
        aria-label="Ajouter aux favoris"
        className={`flex items-center justify-center rounded-full text-neutral-400 transition hover:text-rose-400 ${className}`}
      >
        <Heart size={size} />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={inWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`flex items-center justify-center rounded-full transition disabled:opacity-50 ${
        inWishlist
          ? "text-rose-500 hover:text-rose-400"
          : "text-neutral-400 hover:text-rose-400"
      } ${className}`}
    >
      <Heart size={size} fill={inWishlist ? "currentColor" : "none"} />
    </button>
  );
}
