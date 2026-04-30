import Link from "next/link";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type ApiProduct = {
  id: number;
  name: string;
  price: string | number;
  stock_quantity: number;
  image_url?: string | null;
};

type ApiCategory = {
  id: number;
  name: string;
};

function normalizeProduct(p: ApiProduct): ProductCardData {
  const raw = typeof p.price === "number" ? p.price : Number.parseFloat(String(p.price));
  return {
    id: p.id,
    name: p.name,
    price: Number.isFinite(raw) ? raw : 0,
    stock_quantity: p.stock_quantity,
    image_url: p.image_url ?? null,
  };
}

async function loadHomeData() {
  const [productsRaw, categoriesRaw] = await Promise.all([
    fetch(`${API_BASE}/api/v1/products?limit=4`, {
      next: { revalidate: 60 },
    }).catch(() => null),
    fetch(`${API_BASE}/api/v1/categories`, {
      next: { revalidate: 60 },
    }).catch(() => null),
  ]);

  let products: ProductCardData[] = [];
  if (productsRaw?.ok) {
    const data = (await productsRaw.json()) as ApiProduct[];
    products = Array.isArray(data) ? data.map(normalizeProduct) : [];
  }

  let categories: ApiCategory[] = [];
  if (categoriesRaw?.ok) {
    const data = (await categoriesRaw.json()) as ApiCategory[];
    categories = Array.isArray(data) ? data.slice(0, 4) : [];
  }

  return { products, categories };
}

export default async function Home() {
  const { products, categories } = await loadHomeData();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-950">
      <section className="border-b border-zinc-800/80 px-4 py-20 md:py-28">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="max-w-2xl space-y-6">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">
              ShopOne
            </p>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-50 md:text-5xl lg:text-6xl">
              Elevate Your Everyday
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-zinc-400 md:text-base">
              Refined essentials and contemporary picks — search, filter, and
              shop with a calm, minimal storefront.
            </p>
            <Link
              href="/products"
              className="inline-flex w-fit items-center rounded-md bg-zinc-50 px-8 py-3 text-sm font-medium tracking-wide text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800/80 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Browse by category
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.length > 0 ? (
              categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/products?category_id=${c.id}`}
                    className="flex min-h-[100px] flex-col justify-end rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
                  >
                    <span className="text-sm font-medium text-zinc-100">
                      {c.name}
                    </span>
                    <span className="mt-1 text-xs text-zinc-500">View products</span>
                  </Link>
                </li>
              ))
            ) : (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <li key={i}>
                    <Link
                      href="/products"
                      className="flex min-h-[100px] flex-col justify-end rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20 p-5 transition-colors hover:border-zinc-700"
                    >
                      <span className="text-sm font-medium text-zinc-400">
                        Discover
                      </span>
                      <span className="mt-1 text-xs text-zinc-600">
                        Explore the catalog
                      </span>
                    </Link>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      </section>

      <section className="px-4 py-16 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                Featured
              </h2>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
                New in
              </p>
            </div>
            <Link
              href="/products"
              className="text-sm font-medium text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
            >
              View all
            </Link>
          </div>

          {products.length > 0 ? (
            <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-10 rounded-lg border border-zinc-800 bg-zinc-900/30 py-12 text-center text-sm text-zinc-500">
              Products will appear here when your catalog is ready.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
