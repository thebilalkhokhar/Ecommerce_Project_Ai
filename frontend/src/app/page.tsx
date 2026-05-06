import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200";

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
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <section className="border-b border-gray-200 px-4 py-16 md:py-24 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="flex flex-col justify-center space-y-8">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-textMain/60">
              ShopOne
            </p>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-textMain md:text-6xl md:leading-[1.02] lg:text-7xl">
              Elevate your everyday
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-textMain/70 md:text-xl">
              A premium edit of essentials — quiet luxury, honest materials, and
              a storefront designed to feel as refined as what you wear.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition-opacity hover:opacity-90"
              >
                Shop now
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-surface px-8 py-3.5 text-sm font-semibold tracking-wide text-textMain transition-colors hover:border-gray-400 hover:bg-gray-50"
              >
                Browse categories
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-xl sm:aspect-[16/11] lg:aspect-[4/5] lg:max-h-[min(520px,70vh)]">
              <Image
                src={HERO_IMAGE}
                alt="Minimal clothing boutique interior with racks and warm lighting"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-textMain/25 via-transparent to-transparent"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-textMain/60">
            Browse by category
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {categories.length > 0 ? (
              categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/categories/${c.id}`}
                    className="group relative flex h-32 flex-col justify-end overflow-hidden rounded-2xl border border-gray-200 bg-surface p-6 shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md"
                  >
                    <span className="text-lg font-semibold text-textMain">
                      {c.name}
                    </span>
                    <ArrowRight
                      className="absolute bottom-6 right-6 h-5 w-5 text-textMain/50 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-primary"
                      aria-hidden
                      strokeWidth={1.75}
                    />
                  </Link>
                </li>
              ))
            ) : (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <li key={i}>
                    <Link
                      href="/categories"
                      className="group relative flex h-32 flex-col justify-end overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-surface/80 p-6 shadow-sm transition-all duration-300 hover:border-gray-400 hover:bg-white"
                    >
                      <span className="text-lg font-semibold text-textMain/70">
                        Discover
                      </span>
                      <ArrowRight
                        className="absolute bottom-6 right-6 h-5 w-5 text-textMain/40 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-primary"
                        aria-hidden
                        strokeWidth={1.75}
                      />
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
              <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-textMain/60">
                Featured
              </h2>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-textMain">
                New in
              </p>
            </div>
            <Link
              href="/products"
              className="text-sm font-medium text-textMain/70 underline-offset-4 hover:text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {products.length > 0 ? (
            <ul className="mt-10 grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <li key={product.id} className="flex h-full min-h-0">
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-10 rounded-lg border border-gray-200 bg-surface py-12 text-center text-sm text-textMain/70 shadow-sm">
              Products will appear here when your catalog is ready.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
