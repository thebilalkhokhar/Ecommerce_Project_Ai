"use client";

import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { ImageIcon } from "lucide-react";
import { WishlistButton } from "@/components/products/WishlistButton";
import { useWishlistIds } from "@/components/WishlistIdsProvider";
import { useCartStore } from "@/store/cartStore";

export type ProductCardData = {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  image_url?: string | null;
};

type ProductCardProps = {
  product: ProductCardData;
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const cardWishlistButtonClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/90 bg-white/95 text-textMain/85 shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white hover:text-textMain disabled:cursor-not-allowed disabled:opacity-60";

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { productIds } = useWishlistIds();
  const outOfStock = product.stock_quantity <= 0;
  const hasImage =
    typeof product.image_url === "string" && product.image_url.length > 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-surface shadow-md">
      <div className="relative aspect-square w-full overflow-hidden border-b border-gray-100 bg-gray-50">
        <Link
          href={`/products/${product.id}`}
          className="relative block h-full w-full outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {hasImage ? (
            <Image
              src={product.image_url!}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full min-h-48 w-full items-center justify-center">
              <ImageIcon
                className="h-10 w-10 text-textMain/40"
                strokeWidth={1.25}
                aria-hidden
              />
              <span className="sr-only">No product image</span>
            </div>
          )}
        </Link>
        <div className="pointer-events-auto absolute right-2 top-2 z-10">
          <WishlistButton
            productId={product.id}
            initialIsWishlisted={productIds.has(product.id)}
            className={cardWishlistButtonClass}
            stopClickPropagation
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-textMain">
            <Link
              href={`/products/${product.id}`}
              className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {product.name}
            </Link>
          </h3>
          <p className="text-sm tabular-nums tracking-wide text-textMain/70">
            {formatPrice(product.price)}
          </p>
        </div>

        <button
          type="button"
          disabled={outOfStock}
          onClick={() => {
            addItem({
              id: product.id,
              name: product.name,
              price: product.price,
            });
            toast.success(`${product.name} added to cart!`);
          }}
          className="mt-auto w-full rounded-md bg-primary py-2.5 text-xs font-medium tracking-wide text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-textMain/50 disabled:opacity-100 disabled:hover:opacity-100"
        >
          {outOfStock ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
