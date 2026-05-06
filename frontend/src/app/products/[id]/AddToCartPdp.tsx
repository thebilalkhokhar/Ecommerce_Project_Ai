"use client";

import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";

type AddToCartPdpProps = {
  productId: number;
  name: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string | null;
};

export function AddToCartPdp({
  productId,
  name,
  price,
  stockQuantity,
  imageUrl,
}: AddToCartPdpProps) {
  const addItem = useCartStore((s) => s.addItem);
  const outOfStock = stockQuantity <= 0;

  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={() => {
        addItem({
          id: productId,
          name,
          price,
          ...(imageUrl != null && imageUrl !== ""
            ? { image_url: imageUrl }
            : {}),
        });
        toast.success(`${name} added to cart!`);
      }}
      className="mt-2 w-full max-w-xs rounded-md bg-primary py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-textMain/50"
    >
      {outOfStock ? "Out of stock" : "Add to cart"}
    </button>
  );
}
