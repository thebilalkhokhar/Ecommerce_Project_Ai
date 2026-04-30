"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import api from "@/lib/axios";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

type ApiProduct = {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  stock_quantity: number;
  image_url?: string | null;
};

type ApiCategory = {
  id: number;
  name: string;
};

function normalizeProduct(p: ApiProduct): ProductCardData {
  const price =
    typeof p.price === "number" ? p.price : Number.parseFloat(String(p.price));
  return {
    id: p.id,
    name: p.name,
    price: Number.isFinite(price) ? price : 0,
    stock_quantity: p.stock_quantity,
    image_url: p.image_url ?? null,
  };
}

export function ProductsClient() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = searchParams.get("category_id");
    if (raw == null || raw === "") return;
    const id = Number.parseInt(raw, 10);
    if (Number.isFinite(id)) {
      setSelectedCategoryId(id);
    }
  }, [searchParams]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setCategoriesLoading(true);
      try {
        const { data } = await api.get<ApiCategory[]>("/categories");
        if (!cancelled) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    }

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get<ApiProduct[]>("/products", {
          params: {
            search: searchQuery || undefined,
            category_id: selectedCategoryId ?? undefined,
          },
        });
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

    run();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, selectedCategoryId]);

  const runSearchNow = () => {
    setSearchQuery(searchInput.trim());
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-12">
      <header className="mb-8 border-b border-zinc-800 pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          ShopOne
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">
          Our collection
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
          Curated pieces, minimal presentation. Search and filter by category.
        </p>
      </header>

      <div className="mb-10 flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              strokeWidth={1.5}
              aria-hidden
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearchNow();
              }}
              placeholder="Search by name…"
              className="w-full rounded-full border border-zinc-800 bg-zinc-900/50 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              aria-label="Search products"
            />
          </div>
          <button
            type="button"
            onClick={runSearchNow}
            className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs font-medium tracking-wide text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
          >
            Search
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryId(null)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition-colors ${
              selectedCategoryId === null
                ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            }`}
          >
            All
          </button>
          {categoriesLoading ? (
            <span className="text-xs text-zinc-600">Loading categories…</span>
          ) : (
            categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryId(c.id)}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition-colors ${
                  selectedCategoryId === c.id
                    ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                    : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                {c.name}
              </button>
            ))
          )}
        </div>
      </div>

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
          No products match your filters.
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
