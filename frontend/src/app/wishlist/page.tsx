"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useWishlistIds } from "@/components/WishlistIdsProvider";
import { useAuthStore } from "@/store/authStore";
import { ProductCard } from "@/components/ProductCard";

type WishlistApiRow = {
  id: number;
  user_id: number;
  product: {
    id: number;
    name: string;
    price: string | number;
    stock_quantity: number;
    image_url?: string | null;
  };
};

function WishlistContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { productIds } = useWishlistIds();
  const wishlistSyncKey = useMemo(
    () => [...productIds].sort((a, b) => a - b).join(","),
    [productIds],
  );
  const [items, setItems] = useState<WishlistApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      useAuthStore.getState().initAuth();

      if (!useAuthStore.getState().isAuthenticated) {
        if (!cancelled) {
          setItems([]);
          setError("");
          setLoading(false);
          setBootstrapped(true);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError("");
      }

      try {
        const { data } = await api.get<WishlistApiRow[]>("/wishlist");
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load wishlist.");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setBootstrapped(true);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, wishlistSyncKey]);

  if (!bootstrapped) {
    return (
      <main className="mx-auto max-w-6xl flex-1 px-4 py-12">
        <p className="text-sm text-textMain/60">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-textMain">
        My Wishlist
      </h1>

      {!isAuthenticated && (
        <div className="mt-8 rounded-lg border border-gray-200 bg-surface px-6 py-10 text-center">
          <p className="text-sm text-textMain/70">Sign in to view your wishlist.</p>
          <Link
            href="/login?next=/wishlist"
            className="mt-4 inline-block text-sm font-medium text-textMain underline decoration-textMain/35 underline-offset-4 hover:decoration-primary"
          >
            Sign in
          </Link>
        </div>
      )}

      {isAuthenticated && loading && (
        <p className="mt-8 text-sm text-textMain/60">Loading wishlist…</p>
      )}

      {isAuthenticated && !loading && error && (
        <p className="mt-8 text-sm text-red-300">{error}</p>
      )}

      {isAuthenticated && !loading && !error && items.length === 0 && (
        <p className="mt-8 text-sm text-textMain/60">Your wishlist is empty.</p>
      )}

      {isAuthenticated && !loading && !error && items.length > 0 && (
        <ul className="mt-8 grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((row) => {
            const p = row.product;
            const priceNum =
              typeof p.price === "number"
                ? p.price
                : Number.parseFloat(String(p.price));
            return (
              <li key={row.id} className="flex h-full min-h-0">
                <ProductCard
                  product={{
                    id: p.id,
                    name: p.name,
                    price: Number.isFinite(priceNum) ? priceNum : 0,
                    stock_quantity: p.stock_quantity,
                    image_url: p.image_url,
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-10">
        <Link
          href="/products"
          className="text-sm font-medium text-textMain/70 underline-offset-4 hover:text-textMain hover:underline"
        >
          Browse products
        </Link>
      </p>
    </main>
  );
}

export default function WishlistPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl flex-1 px-4 py-12">
          <p className="text-sm text-textMain/60">Loading…</p>
        </main>
      }
    >
      <WishlistContent />
    </Suspense>
  );
}
