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
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col px-4 py-12">
      <div
        className="relative mb-8 w-full overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 via-surface to-secondary/10 p-8 shadow-sm md:mb-10 md:p-12"
        role="banner"
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-secondary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10">
          <span className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-primary">
            ShopOne
          </span>
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-textMain md:text-5xl">
            Our collection
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-textMain/70">
            Curated pieces, minimal presentation. Search and filter by category.
          </p>
        </div>
      </div>

      <div className="mb-10 flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textMain/60"
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
              className="w-full rounded-full border border-gray-200 bg-gray-100 py-2.5 pl-10 pr-4 text-sm text-textMain placeholder:text-textMain/50 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary/35"
              aria-label="Search products"
            />
          </div>
          <button
            type="button"
            onClick={runSearchNow}
            className="shrink-0 rounded-full border border-gray-300 bg-gray-50 px-5 py-2.5 text-xs font-medium tracking-wide text-textMain transition-colors hover:border-primary/50 hover:bg-gray-200"
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
                ? "border-gray-200 bg-gray-100 text-textMain"
                : "border-gray-200 bg-gray-50 text-textMain/70 hover:border-gray-300 hover:text-textMain"
            }`}
          >
            All
          </button>
          {categoriesLoading ? (
            <span className="text-xs text-textMain/50">Loading categories…</span>
          ) : (
            categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryId(c.id)}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition-colors ${
                  selectedCategoryId === c.id
                    ? "border-gray-200 bg-gray-100 text-textMain"
                    : "border-gray-200 bg-gray-50 text-textMain/70 hover:border-gray-300 hover:text-textMain"
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
          <div className="h-1 w-24 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gray-200" />
          </div>
          <p className="text-sm text-textMain/60">Loading products…</p>
        </div>
      )}

      {!loading && error && (
        <div
          className="rounded-lg border border-gray-200 bg-gray-100 px-5 py-8 text-center"
          role="alert"
        >
          <p className="text-sm text-textMain/70">{error}</p>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="py-16 text-center text-sm text-textMain/60">
          No products match your filters.
        </p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="w-full min-w-0 flex-1">
          <ul className="grid w-full min-w-0 grid-cols-1 items-stretch gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <li key={product.id} className="flex h-full min-h-0">
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
