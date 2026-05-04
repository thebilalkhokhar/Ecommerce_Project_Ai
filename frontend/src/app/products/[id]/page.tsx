import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { fetchProductById, type ProductDetailApi } from "@/lib/api";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { ProductDetailActions } from "./ProductDetailActions";

function formatPrice(value: string | number): string {
  const n =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

function formatAvgRating(raw: string | number | undefined): string {
  if (raw === undefined || raw === null) return "0.0";
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
  if (!Number.isFinite(n)) return "0.0";
  return n.toFixed(1);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product: ProductDetailApi | null;
  try {
    product = await fetchProductById(id);
  } catch {
    throw new Error("Failed to load product");
  }
  if (product == null) {
    notFound();
  }

  const totalReviews = product.total_reviews ?? 0;
  const avgLabel = formatAvgRating(product.average_rating);
  const hasImage =
    typeof product.image_url === "string" && product.image_url.length > 0;
  const inStock = product.stock_quantity > 0;

  return (
    <div className="mx-auto max-w-6xl flex-1 px-4 py-10">
      <nav className="mb-8 text-sm text-zinc-500">
        <Link href="/products" className="hover:text-zinc-300">
          Products
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <span className="text-zinc-400">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="relative aspect-square w-full max-w-xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 lg:mx-0">
          {hasImage ? (
            <Image
              src={product.image_url!}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon
                className="h-16 w-16 text-zinc-600"
                strokeWidth={1}
                aria-hidden
              />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">
            {product.name}
          </h1>
          {product.variants && product.variants.length > 0 ? (
            <p className="mt-2 text-sm text-zinc-500">
              Select a variant below to see price and availability.
            </p>
          ) : (
            <p className="mt-2 text-2xl font-medium tabular-nums text-zinc-200">
              {formatPrice(product.price)}
            </p>
          )}
          <p className="mt-3 text-sm text-zinc-400">
            <span aria-hidden>⭐</span>{" "}
            <span className="tabular-nums">{avgLabel}</span>
            {totalReviews > 0 ? (
              <span className="text-zinc-500">
                {" "}
                ({totalReviews} Review{totalReviews === 1 ? "" : "s"})
              </span>
            ) : (
              <span className="text-zinc-500"> (no reviews yet)</span>
            )}
          </p>
          {!(product.variants && product.variants.length > 0) && (
            <p
              className={`mt-4 text-sm font-medium ${
                inStock ? "text-emerald-400/90" : "text-red-400/90"
              }`}
            >
              {inStock
                ? `${product.stock_quantity} in stock`
                : "Out of stock"}
            </p>
          )}
          {product.description ? (
            <p className="mt-6 text-sm leading-relaxed text-zinc-400">
              {product.description}
            </p>
          ) : null}
          <ProductDetailActions key={product.id} product={product} />
        </div>
      </div>

      <ProductReviews productId={product.id} />

      <section className="mt-16 border-t border-zinc-800 bg-zinc-950 pt-8">
        <RelatedProducts productId={product.id} />
      </section>
    </div>
  );
}
