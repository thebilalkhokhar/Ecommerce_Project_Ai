"use client";

import toast from "react-hot-toast";
import { Package } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export type ProductCardData = {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
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

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const outOfStock = product.stock_quantity <= 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="flex aspect-4/3 items-center justify-center bg-zinc-900">
        <Package
          className="h-12 w-12 text-zinc-600"
          strokeWidth={1.25}
          aria-hidden
        />
        <span className="sr-only">No product image</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-zinc-50">
            {product.name}
          </h3>
          <p className="text-sm tabular-nums tracking-wide text-zinc-400">
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
          className="mt-auto w-full rounded-md border border-zinc-700 py-2.5 text-xs font-medium tracking-wide text-zinc-100 transition-colors hover:border-zinc-100 hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
        >
          {outOfStock ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
