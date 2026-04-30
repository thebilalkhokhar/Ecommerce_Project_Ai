"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { AddToCartPdp } from "./AddToCartPdp";
import { WishlistButton } from "@/components/products/WishlistButton";

type ProductDetailActionsProps = {
  productId: number;
  name: string;
  price: number;
  stockQuantity: number;
};

/** Add to cart + wishlist; hydrates wishlist heart when the user is logged in. */
export function ProductDetailActions({
  productId,
  name,
  price,
  stockQuantity,
}: ProductDetailActionsProps) {
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
        const on = Array.isArray(data) && data.some((w) => w.product.id === productId);
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
  }, [isAuthenticated, productId]);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <AddToCartPdp
        productId={productId}
        name={name}
        price={price}
        stockQuantity={stockQuantity}
      />
      {hydrated ? (
        <WishlistButton
          productId={productId}
          initialIsWishlisted={wishlisted}
        />
      ) : (
        <div
          className="h-11 w-11 shrink-0 animate-pulse rounded-md border border-zinc-800 bg-zinc-900"
          aria-hidden
        />
      )}
    </div>
  );
}
