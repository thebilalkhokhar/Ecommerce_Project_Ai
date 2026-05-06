"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Star } from "lucide-react";
import api from "@/lib/axios";

type ReviewFormProps = {
  productId: number;
  onSuccess: () => void | Promise<void>;
};

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please enter a comment.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, {
        rating,
        comment: comment.trim(),
      });
      toast.success("Review submitted.");
      setComment("");
      setRating(5);
      await onSuccess();
    } catch (err) {
      let msg = "Could not submit review.";
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          msg = "Please log in to post a review.";
        } else if (typeof err.response?.data?.detail === "string") {
          msg = err.response.data.detail;
        }
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-5"
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-textMain/60">
        Your rating
      </p>
      <div className="mb-4 flex gap-1" role="group" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className="rounded p-0.5 text-secondary transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/35"
            aria-label={`${n} stars`}
          >
            <Star
              className={`h-7 w-7 ${n <= rating ? "fill-current" : "fill-none"}`}
              strokeWidth={1.25}
            />
          </button>
        ))}
      </div>
      <label htmlFor="review-comment" className="sr-only">
        Review comment
      </label>
      <textarea
        id="review-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        placeholder="Share your experience…"
        className="w-full rounded-md border border-gray-200 bg-surface px-3 py-2.5 text-sm text-textMain placeholder:text-textMain/50 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary/35"
      />
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded-md bg-primary px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
