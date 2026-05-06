"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Heart } from "lucide-react";
import api from "@/lib/axios";
import { useWishlistIds } from "@/components/WishlistIdsProvider";
import { useAuthStore } from "@/store/authStore";

type WishlistButtonProps = {
  productId: number;
  initialIsWishlisted?: boolean;
  /** Extra classes for the outer button (size, position). */
  className?: string;
  /** Classes for the heart icon. */
  iconClassName?: string;
  /** Use on product cards so the image Link does not receive the click. */
  stopClickPropagation?: boolean;
};

export function WishlistButton({
  productId,
  initialIsWishlisted = false,
  className,
  iconClassName,
  stopClickPropagation = false,
}: WishlistButtonProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { refresh } = useWishlistIds();
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsWishlisted(initialIsWishlisted);
  }, [initialIsWishlisted]);

  const defaultButtonClass =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-gray-50 text-textMain/80 transition hover:border-primary/50 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60";

  const defaultIconFilled = "h-5 w-5 fill-red-500 text-red-500";
  const defaultIconOutline = "h-5 w-5";

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={async (e) => {
        if (stopClickPropagation) {
          e.preventDefault();
          e.stopPropagation();
        }
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
          await refresh();
          toast.success(
            added ? "Saved to your wishlist" : "Removed from wishlist",
          );
        } catch {
          toast.error("Could not update wishlist. Try again.");
        } finally {
          setIsLoading(false);
        }
      }}
      className={className ?? defaultButtonClass}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={
          iconClassName ??
          (isWishlisted ? defaultIconFilled : defaultIconOutline)
        }
        strokeWidth={1.75}
      />
    </button>
  );
}
