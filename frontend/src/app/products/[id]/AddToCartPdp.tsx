"use client";

import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";

type AddToCartPdpProps = {
  productId: number;
  name: string;
  price: number;
  stockQuantity: number;
};

export function AddToCartPdp({
  productId,
  name,
  price,
  stockQuantity,
}: AddToCartPdpProps) {
  const addItem = useCartStore((s) => s.addItem);
  const outOfStock = stockQuantity <= 0;

  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={() => {
        addItem({ id: productId, name, price });
        toast.success(`${name} added to cart!`);
      }}
      className="mt-2 w-full max-w-xs rounded-md border border-zinc-700 bg-zinc-50 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600"
    >
      {outOfStock ? "Out of stock" : "Add to cart"}
    </button>
  );
}
