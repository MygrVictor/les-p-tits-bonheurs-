import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, ProductVariant } from "@/lib/catalog";

export type CartItem = {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  variantId: string | null;
  variantLabel: string | null;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant | null, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
};

// Selectors — utilisez ceux-ci dans les composants
export const selectCartCount = (s: CartState) =>
  s.items.reduce((acc, i) => acc + i.quantity, 0);

export const selectCartTotal = (s: CartState) =>
  s.items.reduce((acc, i) => acc + i.price * i.quantity, 0);

// Storage SSR-safe
const ssrSafeStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  return localStorage;
});

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (product, variant, qty = 1) => {
        const id = variant ? `${product.id}__${variant.id}` : product.id;
        const price = variant?.price ?? product.salePrice ?? product.price;
        set((state) => {
          const existing = state.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === id ? { ...i, quantity: i.quantity + qty } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id,
                productId: product.id,
                productName: product.name,
                productImage: product.images[0] ?? "",
                variantId: variant?.id ?? null,
                variantLabel: variant
                  ? `${variant.name} · ${variant.value}`
                  : null,
                price,
                quantity: qty,
              },
            ],
          };
        });
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQty: (id, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) =>
                  i.id === id ? { ...i, quantity: qty } : i,
                ),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "lpb-cart",
      storage: ssrSafeStorage,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
