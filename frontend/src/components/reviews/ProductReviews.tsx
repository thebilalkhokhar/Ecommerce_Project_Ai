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
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-zinc-600"
          }`}
          strokeWidth={1.25}
        />
      ))}
    </div>
  );
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

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<ReviewItem[]>(
        `/products/${productId}/reviews`,
        { params: { limit: 100 } },
      );
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Could not load reviews.");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

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
    <section className="mt-16 border-t border-zinc-800 pt-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-50">
          Customer Reviews
        </h2>
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
          >
            {showForm ? "Cancel" : "Write a Review"}
          </button>
        ) : (
          <p className="text-sm text-zinc-500">
            Please log in to write a review.
          </p>
        )}
      </div>

      {isAuthenticated && showForm && (
        <ReviewForm productId={productId} onSuccess={loadReviews} />
      )}

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 border-dashed bg-zinc-900/20 py-10 text-center text-sm text-zinc-500">
          No reviews yet. Be the first to share your thoughts.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => {
            const displayName = r.user?.name?.trim() || "Anonymous";
            return (
              <li
                key={r.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-100">{displayName}</p>
                    <div className="mt-1">
                      <StarRow rating={r.rating} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {r.is_verified_purchase && (
                      <span className="rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                  {r.comment}
                </p>
                {r.admin_reply ? (
                  <div className="mt-3 border-l-2 border-zinc-500 bg-zinc-950 p-3 text-sm text-zinc-400">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Store
                    </p>
                    <p className="mt-1">{r.admin_reply}</p>
                  </div>
                ) : null}
                <div className="mt-3 flex items-center gap-3 border-t border-zinc-800 pt-3">
                  <button
                    type="button"
                    disabled={reactingId === r.id}
                    onClick={() => handleHelpful(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Helpful
                    {r.likes_count > 0 ? (
                      <span className="tabular-nums text-zinc-500">
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
