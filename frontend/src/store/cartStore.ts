import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Product fields kept in the cart line (matches API usage). */
export type CartProduct = {
  id: number;
  name: string;
  price: number;
  variant_name?: string;
  /** Product photo URL when available (shown in cart / checkout). */
  image_url?: string | null;
};

export type CartLine = {
  product: CartProduct;
  quantity: number;
};

/** Alias for cart lines (same as `CartLine`). */
export type CartItem = CartLine;

type CartState = {
  items: CartLine[];
  /** Sum of line totals: price × quantity for all items. */
  totalPrice: number;
  addItem: (product: CartProduct) => void;
  removeItem: (productId: number, variantName?: string | null) => void;
  updateQuantity: (
    productId: number,
    quantity: number,
    variantName?: string | null,
  ) => void;
  clearCart: () => void;
};

function variantKey(variantName?: string | null): string {
  return variantName ?? "";
}

function lineMatches(
  line: CartLine,
  productId: number,
  variantName?: string | null,
): boolean {
  return (
    line.product.id === productId &&
    variantKey(line.product.variant_name) === variantKey(variantName)
  );
}

function computeTotal(items: CartLine[]): number {
  const raw = items.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );
  return Math.round(raw * 100) / 100;
}

/**
 * Cart persistence: localStorage via Zustand persist (guest + logged-in).
 * Backend has no cart API yet; when it exists, merge server cart here and keep storage as fallback.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      totalPrice: 0,

      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((i) =>
            lineMatches(i, product.id, product.variant_name),
          );
          let items: CartLine[];
          if (existing) {
            items = state.items.map((i) =>
              lineMatches(i, product.id, product.variant_name)
                ? {
                    ...i,
                    quantity: i.quantity + 1,
                    product: {
                      ...i.product,
                      image_url:
                        product.image_url != null && String(product.image_url).trim() !== ""
                          ? product.image_url
                          : i.product.image_url,
                    },
                  }
                : i,
            );
          } else {
            items = [...state.items, { product, quantity: 1 }];
          }
          return { items, totalPrice: computeTotal(items) };
        }),

      removeItem: (productId, variantName) =>
        set((state) => {
          const items = state.items.filter(
            (i) => !lineMatches(i, productId, variantName),
          );
          return { items, totalPrice: computeTotal(items) };
        }),

      updateQuantity: (productId, quantity, variantName) =>
        set((state) => {
          let items: CartLine[];
          if (quantity <= 0) {
            items = state.items.filter(
              (i) => !lineMatches(i, productId, variantName),
            );
          } else {
            items = state.items.map((i) =>
              lineMatches(i, productId, variantName)
                ? { ...i, quantity }
                : i,
            );
          }
          return { items, totalPrice: computeTotal(items) };
        }),

      clearCart: () => set({ items: [], totalPrice: 0 }),
    }),
    {
      name: "shopone-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        totalPrice: state.totalPrice,
      }),
      skipHydration: true,
      merge: (persisted, current) => {
        const p = persisted as Partial<Pick<CartState, "items" | "totalPrice">>;
        const items = Array.isArray(p?.items) ? p.items : [];
        return {
          ...current,
          items,
          totalPrice: computeTotal(items),
        };
      },
    },
  ),
);

/** Total number of units across all lines (for badge counts). */
export function selectItemUnitCount(state: CartState): number {
  return state.items.reduce((n, line) => n + line.quantity, 0);
}
