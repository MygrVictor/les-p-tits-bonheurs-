"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: number;
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
    if (status !== "authenticated") return;

    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data: { items?: { product: { slug: string; id: string } }[] }) => {
        if (!data.items) return;
        const found = data.items.some(
          (item) =>
            item.product.slug === productId || item.product.id === productId,
        );
        setInWishlist(found);
      })
      .catch(() => {});
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
          if (res.ok) setInWishlist(false);
        } else {
          const res = await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
          if (res.ok) setInWishlist(true);
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
