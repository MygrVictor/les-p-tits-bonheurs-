import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore, selectCartCount, selectCartTotal } from "../cart-store";

const baseProduct = {
  id: "prod_1",
  name: "Bracelet",
  description: "desc",
  price: 2000,
  salePrice: 1500,
  brandId: "brand_1",
  categoryId: "cat_1",
  images: ["/a.jpg"],
  stock: 10,
  status: "active" as const,
  isNew: false,
  tags: [],
  featured: false,
  variants: [],
  stones: [],
};

describe("cart-store", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("adds and merges items with quantity", () => {
    useCartStore.getState().addItem(baseProduct as any, null, 1);
    useCartStore.getState().addItem(baseProduct as any, null, 2);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
    expect(state.items[0].price).toBe(1500);
  });

  it("handles variant-specific cart lines", () => {
    const variant = {
      id: "var_1",
      productId: "prod_1",
      name: "Taille",
      value: "M",
      stock: 4,
      price: 1800,
    };

    useCartStore.getState().addItem(baseProduct as any, variant as any, 1);
    const state = useCartStore.getState();
    expect(state.items[0].id).toBe("prod_1__var_1");
    expect(state.items[0].variantLabel).toContain("Taille");
    expect(state.items[0].price).toBe(1800);
  });

  it("updates quantity, removes and clears items", () => {
    useCartStore.getState().addItem(baseProduct as any, null, 3);
    const id = useCartStore.getState().items[0].id;

    useCartStore.getState().updateQty(id, 2);
    expect(useCartStore.getState().items[0].quantity).toBe(2);

    useCartStore.getState().updateQty(id, 0);
    expect(useCartStore.getState().items).toHaveLength(0);

    useCartStore.getState().addItem(baseProduct as any, null, 1);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("computes selectors", () => {
    useCartStore.setState({
      items: [
        {
          id: "a",
          productId: "p1",
          productName: "A",
          productImage: "/a.jpg",
          variantId: null,
          variantLabel: null,
          price: 1000,
          quantity: 2,
        },
        {
          id: "b",
          productId: "p2",
          productName: "B",
          productImage: "/b.jpg",
          variantId: null,
          variantLabel: null,
          price: 500,
          quantity: 1,
        },
      ],
    });

    const state = useCartStore.getState() as any;
    expect(selectCartCount(state)).toBe(3);
    expect(selectCartTotal(state)).toBe(2500);
  });
});
