import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CreditCard, Package, Search, ShoppingBag } from "lucide-react";
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
      <section className="px-4 py-12 md:py-16 lg:py-20">
        <div className="mx-auto grid w-full min-w-0 max-w-7xl gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div
            className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 via-surface to-secondary/10 p-8 shadow-sm md:p-10 lg:p-12"
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
            <div className="relative z-10 flex flex-col">
              <span className="mb-4 inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-primary">
                ShopOne
              </span>
              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-textMain md:text-5xl md:leading-[1.05] lg:text-6xl">
                Elevate your everyday
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-textMain/70 md:text-xl">
                A premium edit of essentials — quiet luxury, honest materials,
                and a storefront designed to feel as refined as what you wear.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold tracking-wide text-white shadow-md transition-all hover:opacity-95 active:scale-[0.98]"
                >
                  Shop now
                </Link>
                <Link
                  href="/categories"
                  className="inline-flex items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 px-8 py-3.5 text-sm font-semibold tracking-wide text-textMain shadow-sm transition-all hover:border-primary/30 hover:bg-primary/10 active:scale-[0.98]"
                >
                  Browse categories
                </Link>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-primary/10 bg-surface shadow-sm sm:aspect-[16/11] lg:aspect-[4/5] lg:max-h-[min(520px,70vh)]">
              <Image
                src={HERO_IMAGE}
                alt="Minimal clothing boutique interior with racks and warm lighting"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-textMain/20 via-transparent to-transparent"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-t border-primary/10 px-4 py-12 md:py-16"
        aria-labelledby="how-to-order-heading"
      >
        <div className="mx-auto w-full min-w-0 max-w-7xl">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Simple flow
          </span>
          <h2
            id="how-to-order-heading"
            className="mt-3 text-2xl font-extrabold tracking-tight text-textMain md:text-3xl"
          >
            How to order
          </h2>
          <p className="mt-2 max-w-2xl text-base text-textMain/70">
            From discovery to delivery — four quick steps. No clutter, no
            guesswork.
          </p>
          <ol className="mt-10 grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <li className="min-w-0">
              <div className="flex h-full flex-col rounded-2xl border border-primary/10 bg-surface p-6 shadow-sm transition-all hover:border-primary/15 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    1
                  </span>
                  <div className="inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                    <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </div>
                </div>
                <h3 className="mt-4 text-base font-semibold text-textMain">
                  Browse &amp; search
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-textMain/70">
                  Open{" "}
                  <Link
                    href="/products"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Products
                  </Link>{" "}
                  or pick a category. Use search when you know what you want.
                </p>
              </div>
            </li>
            <li className="min-w-0">
              <div className="flex h-full flex-col rounded-2xl border border-primary/10 bg-surface p-6 shadow-sm transition-all hover:border-primary/15 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    2
                  </span>
                  <div className="inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                    <ShoppingBag
                      className="h-5 w-5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
                </div>
                <h3 className="mt-4 text-base font-semibold text-textMain">
                  Add to cart
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-textMain/70">
                  Choose variants if needed, then add items. Review everything in
                  your{" "}
                  <Link
                    href="/cart"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    cart
                  </Link>{" "}
                  before checkout.
                </p>
              </div>
            </li>
            <li className="min-w-0">
              <div className="flex h-full flex-col rounded-2xl border border-primary/10 bg-surface p-6 shadow-sm transition-all hover:border-primary/15 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    3
                  </span>
                  <div className="inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                    <CreditCard
                      className="h-5 w-5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
                </div>
                <h3 className="mt-4 text-base font-semibold text-textMain">
                  Checkout &amp; pay
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-textMain/70">
                  Enter shipping details and pay securely online, or choose cash
                  on delivery where available.
                </p>
              </div>
            </li>
            <li className="min-w-0">
              <div className="flex h-full flex-col rounded-2xl border border-primary/10 bg-surface p-6 shadow-sm transition-all hover:border-primary/15 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    4
                  </span>
                  <div className="inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                    <Package className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </div>
                </div>
                <h3 className="mt-4 text-base font-semibold text-textMain">
                  Track your order
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-textMain/70">
                  Sign in anytime to see updates under{" "}
                  <Link
                    href="/orders"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Orders
                  </Link>
                  . We&apos;ll keep your receipt handy too.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="border-t border-primary/10 px-4 py-12 md:py-16">
        <div className="mx-auto w-full min-w-0 max-w-7xl">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Categories
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-textMain md:text-3xl">
            Browse by category
          </h2>
          <ul className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {categories.length > 0 ? (
              categories.map((c) => (
                <li key={c.id} className="min-w-0">
                  <Link
                    href={`/categories/${c.id}`}
                    className="group relative flex h-36 flex-col justify-end overflow-hidden rounded-2xl border border-primary/10 bg-surface p-6 shadow-sm transition-all hover:border-primary/20 hover:bg-primary/5 hover:shadow-md active:scale-[0.98]"
                  >
                    <span className="text-lg font-semibold text-textMain">
                      {c.name}
                    </span>
                    <ArrowRight
                      className="absolute bottom-6 right-6 h-5 w-5 text-textMain/40 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-primary"
                      aria-hidden
                      strokeWidth={1.75}
                    />
                  </Link>
                </li>
              ))
            ) : (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <li key={i} className="min-w-0">
                    <Link
                      href="/categories"
                      className="group relative flex h-36 flex-col justify-end overflow-hidden rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-6 shadow-sm transition-all hover:border-primary/35 hover:bg-primary/10 active:scale-[0.98]"
                    >
                      <span className="text-lg font-semibold text-textMain/80">
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
        <div className="mx-auto w-full min-w-0 max-w-7xl">
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
            <ul className="mt-10 grid w-full grid-cols-1 items-stretch gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
