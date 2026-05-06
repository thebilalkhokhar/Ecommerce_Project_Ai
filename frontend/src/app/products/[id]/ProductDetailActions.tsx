"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import type { ProductDetailApi, ProductVariantApi } from "@/lib/api";
import { WishlistButton } from "@/components/products/WishlistButton";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

function formatPricePKR(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function parsePrice(raw: string | number): number {
  if (typeof raw === "number") return raw;
  const n = Number.parseFloat(String(raw));
  return Number.isFinite(n) ? n : 0;
}

type ProductDetailActionsProps = {
  product: ProductDetailApi;
};

/** Add to cart + wishlist; hydrates wishlist heart when the user is logged in. */
export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const variants = product.variants ?? [];
  const basePrice = parsePrice(product.price);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariantApi | null>(
    () => {
      const v = product.variants ?? [];
      return v.length > 0 ? v[0] : null;
    },
  );

  const currentPrice =
    basePrice + (selectedVariant?.price_adjustment ?? 0);
  const currentStock = selectedVariant
    ? selectedVariant.stock_quantity
    : product.stock_quantity;

  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [wishlisted, setWishlisted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useAuthStore.getState().initAuth();
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!useAuthStore.getState().isAuthenticated) {
      setWishlisted(false);
      setHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    setHydrated(false);
    (async () => {
      try {
        const { data } = await api.get<
          Array<{ id: number; product: { id: number } }>
        >("/wishlist");
        if (cancelled) return;
        const on = Array.isArray(data) && data.some((w) => w.product.id === product.id);
        setWishlisted(on);
      } catch {
        if (!cancelled) setWishlisted(false);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, product.id]);

  return (
    <div className="mt-6 flex flex-col gap-4">
      {variants.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-textMain/60">
            Select variant
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const sel = selectedVariant?.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    sel
                      ? "border-gray-300 bg-gray-200 text-textMain"
                      : "border-gray-200 bg-gray-50 text-textMain/80 hover:border-gray-300"
                  }`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="text-2xl font-medium tabular-nums text-textMain">
        {formatPricePKR(currentPrice)}
      </p>

      {currentStock === 0 ? (
        <p className="text-sm font-medium text-red-600">Out of stock</p>
      ) : (
        <p className="text-sm font-medium text-emerald-700">
          {currentStock} in stock
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={currentStock <= 0}
          onClick={() => {
            addItem({
              id: product.id,
              name: product.name,
              price: currentPrice,
              ...(selectedVariant?.name
                ? { variant_name: selectedVariant.name }
                : {}),
            });
            toast.success(`${product.name} added to cart!`);
          }}
          className="w-full max-w-xs rounded-md bg-primary py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-textMain/50 disabled:opacity-100"
        >
          {currentStock <= 0 ? "Out of stock" : "Add to cart"}
        </button>
        {hydrated ? (
          <WishlistButton
            productId={product.id}
            initialIsWishlisted={wishlisted}
          />
        ) : (
          <div
            className="h-11 w-11 shrink-0 animate-pulse rounded-md border border-gray-200 bg-gray-50"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
