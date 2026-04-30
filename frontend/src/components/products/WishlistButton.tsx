"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Heart } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

type WishlistButtonProps = {
  productId: number;
  initialIsWishlisted?: boolean;
};

export function WishlistButton({
  productId,
  initialIsWishlisted = false,
}: WishlistButtonProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={async () => {
        if (!isAuthenticated) {
          toast.error("Please log in to add to wishlist");
          return;
        }
        setIsLoading(true);
        try {
          const { data } = await api.post<{ status: "added" | "removed" }>(
            `/wishlist/${productId}/toggle`,
          );
          const added = data.status === "added";
          setIsWishlisted(added);
          toast.success(
            added ? "Saved to your wishlist" : "Removed from wishlist",
          );
        } catch {
          toast.error("Could not update wishlist. Try again.");
        } finally {
          setIsLoading(false);
        }
      }}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={
          isWishlisted
            ? "h-5 w-5 fill-red-500 text-red-500"
            : "h-5 w-5"
        }
        strokeWidth={1.75}
      />
    </button>
  );
}
