"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Star, ThumbsUp } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { ReviewForm } from "./ReviewForm";

export type ReviewItem = {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment: string;
  admin_reply: string | null;
  is_verified_purchase: boolean;
  image_urls?: string[];
  user: { name: string };
  likes_count: number;
  dislikes_count: number;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${
            n <= rating
              ? "fill-secondary text-secondary"
              : "fill-none text-textMain/50"
          }`}
          strokeWidth={1.25}
        />
      ))}
    </div>
  );
}

async function fetchProductReviews(
  productId: number,
): Promise<ReviewItem[]> {
  const { data } = await api.get<ReviewItem[]>(
    `/products/${productId}/reviews`,
    { params: { limit: 100 } },
  );
  return Array.isArray(data) ? data : [];
}

type ProductReviewsProps = {
  productId: number;
};

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reactingId, setReactingId] = useState<number | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchProductReviews(productId);
        if (!cancelled) setReviews(list);
      } catch {
        if (!cancelled) {
          toast.error("Could not load reviews.");
          setReviews([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await fetchProductReviews(productId);
      setReviews(list);
    } catch {
      toast.error("Could not load reviews.");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  async function handleHelpful(reviewId: number) {
    if (!isAuthenticated) {
      toast.error("Please log in to mark helpful.");
      return;
    }
    setReactingId(reviewId);
    try {
      await api.post(`/reviews/${reviewId}/react`, { is_like: true });
      toast.success("Thanks for your feedback.");
      await loadReviews();
    } catch (err) {
      let msg = "Could not update.";
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          msg = "Please log in.";
        } else if (typeof err.response?.data?.detail === "string") {
          msg = err.response.data.detail;
        }
      }
      toast.error(msg);
    } finally {
      setReactingId(null);
    }
  }

  return (
    <section className="mt-16 border-t border-gray-200 pt-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-textMain">
          Customer Reviews
        </h2>
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-textMain transition hover:border-primary/50"
          >
            {showForm ? "Cancel" : "Write a Review"}
          </button>
        ) : (
          <p className="text-sm text-textMain/60">
            Please log in to write a review.
          </p>
        )}
      </div>

      {isAuthenticated && showForm && (
        <ReviewForm productId={productId} onSuccess={loadReviews} />
      )}

      {isLoading ? (
        <p className="text-sm text-textMain/60">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="rounded-lg border border-gray-200 border-dashed bg-gray-50 py-10 text-center text-sm text-textMain/60">
          No reviews yet. Be the first to share your thoughts.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => {
            const displayName = r.user?.name?.trim() || "Anonymous";
            const images = Array.isArray(r.image_urls) ? r.image_urls : [];
            return (
              <li
                key={r.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-textMain">{displayName}</p>
                    <div className="mt-1">
                      <StarRow rating={r.rating} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {r.is_verified_purchase && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-textMain/80">
                  {r.comment}
                </p>
                {images.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {images.map((url) => (
                      <li key={url}>
                        <button
                          type="button"
                          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                          className="block overflow-hidden rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/35"
                          aria-label="Open review photo in new tab"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="h-16 w-16 object-cover"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {r.admin_reply ? (
                  <div className="mt-3 ml-0.5 border-l-4 border-primary/45 bg-[#F4F4F8] py-3 pl-4 pr-3 text-sm text-textMain/85">
                    <span className="inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Store Owner
                    </span>
                    <p className="mt-2 leading-relaxed">{r.admin_reply}</p>
                  </div>
                ) : null}
                <div className="mt-3 flex items-center gap-3 border-t border-gray-200 pt-3">
                  <button
                    type="button"
                    disabled={reactingId === r.id}
                    onClick={() => handleHelpful(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-surface px-2.5 py-1 text-xs font-medium text-textMain/70 transition hover:border-gray-300 hover:text-textMain disabled:opacity-50"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Helpful
                    {r.likes_count > 0 ? (
                      <span className="tabular-nums text-textMain/60">
                        ({r.likes_count})
                      </span>
                    ) : null}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
