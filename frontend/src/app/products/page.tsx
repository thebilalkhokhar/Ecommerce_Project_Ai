"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

type ApiProduct = {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  stock_quantity: number;
};

function normalizeProduct(p: ApiProduct): ProductCardData {
  const price =
    typeof p.price === "number" ? p.price : Number.parseFloat(String(p.price));
  return {
    id: p.id,
    name: p.name,
    price: Number.isFinite(price) ? price : 0,
    stock_quantity: p.stock_quantity,
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get<ApiProduct[]>("/products");
        if (!cancelled) {
          setProducts((Array.isArray(data) ? data : []).map(normalizeProduct));
        }
      } catch {
        if (!cancelled) {
          setError("Could not load products. Is the API running?");
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-12">
      <header className="mb-10 border-b border-zinc-800 pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          ShopOne
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">
          Our collection
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
          Curated pieces, minimal presentation. Prices reflect live inventory.
        </p>
      </header>

      {loading && (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-4 py-24"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="h-1 w-24 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-zinc-500" />
          </div>
          <p className="text-sm text-zinc-500">Loading products…</p>
        </div>
      )}

      {!loading && error && (
        <div
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-8 text-center"
          role="alert"
        >
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="py-16 text-center text-sm text-zinc-500">
          No products yet. Add some from the admin or seed the catalog.
        </p>
      )}

      {!loading && !error && products.length > 0 && (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
