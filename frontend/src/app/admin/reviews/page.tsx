"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Loader2, Star } from "lucide-react";
import api from "@/lib/axios";

type AdminReviewRow = {
  id: number;
  product_id: number;
  product_name: string;
  user_id: number;
  rating: number;
  comment: string;
  admin_reply: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  image_urls: string[];
  user: { name: string };
  likes_count: number;
  dislikes_count: number;
};

const textareaClass =
  "mt-2 w-full rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-sm text-textMain shadow-sm transition placeholder:text-textMain/45 focus:border-primary/30 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= rating
              ? "fill-secondary text-secondary"
              : "fill-none text-textMain/35"
          }`}
          strokeWidth={1.25}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<AdminReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [replyFor, setReplyFor] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const load = useCallback(async () => {
    const { data } = await api.get<AdminReviewRow[]>("/admin/reviews");
    setRows(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch {
        if (!cancelled) {
          toast.error("Could not load reviews.");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function setApproved(id: number, is_approved: boolean) {
    setBusyId(id);
    try {
      await api.put(`/admin/reviews/${id}`, { is_approved });
      toast.success(is_approved ? "Review approved." : "Review rejected.");
      await load();
    } catch (err) {
      let msg = "Could not update review.";
      if (axios.isAxiosError(err)) {
        if (typeof err.response?.data?.detail === "string") {
          msg = err.response.data.detail;
        }
      }
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function submitReply(id: number) {
    const text = replyDraft.trim();
    if (!text) {
      toast.error("Enter a reply.");
      return;
    }
    setBusyId(id);
    try {
      await api.put(`/admin/reviews/${id}`, { admin_reply: text });
      toast.success("Reply saved.");
      setReplyFor(null);
      setReplyDraft("");
      await load();
    } catch (err) {
      let msg = "Could not save reply.";
      if (axios.isAxiosError(err)) {
        if (typeof err.response?.data?.detail === "string") {
          msg = err.response.data.detail;
        }
      }
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  function openReply(r: AdminReviewRow) {
    setReplyFor(r.id);
    setReplyDraft(r.admin_reply ?? "");
  }

  return (
    <div className="space-y-8 pb-4">
      <header className="rounded-2xl border border-primary/10 bg-surface px-5 py-6 shadow-sm md:px-7 md:py-8">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Moderation
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-textMain md:text-3xl">
          Reviews
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-textMain/70">
          Approve customer reviews and post store replies. Pending reviews stay
          off the storefront until you mark them public.
        </p>
      </header>

      {!loading ? (
        <p className="text-xs font-medium text-textMain/50">
          {rows.length} {rows.length === 1 ? "review" : "reviews"}
        </p>
      ) : null}

      {loading ? (
        <div
          className="flex items-center gap-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-6 py-12"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2
            className="h-6 w-6 shrink-0 animate-spin text-primary"
            strokeWidth={2}
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium text-textMain">Loading reviews…</p>
            <p className="mt-0.5 text-xs text-textMain/55">
              Fetching moderation queue
            </p>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-14 text-center text-sm font-medium text-textMain/70">
          No reviews yet. They’ll show up after customers leave feedback on
          products.
        </p>
      ) : (
        <ul className="space-y-5">
          {rows.map((r) => {
            const busy = busyId === r.id;
            const imgs = Array.isArray(r.image_urls) ? r.image_urls : [];
            return (
              <li
                key={r.id}
                className="rounded-2xl border border-primary/10 bg-surface p-5 shadow-sm transition-shadow hover:border-primary/15 hover:shadow-md md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          r.is_approved
                            ? "border border-emerald-200/80 bg-emerald-50 text-emerald-900"
                            : "border border-amber-200/80 bg-amber-50 text-amber-950"
                        }`}
                      >
                        {r.is_approved ? "Approved" : "Pending"}
                      </span>
                      {r.is_verified_purchase ? (
                        <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-textMain/75">
                          Verified
                        </span>
                      ) : null}
                    </div>
                    <p className="text-base font-semibold text-textMain">
                      {r.product_name || `Product #${r.product_id}`}
                    </p>
                    <p className="text-xs text-textMain/55">
                      {r.user?.name?.trim() || "Customer"}{" "}
                      <span className="text-textMain/35">·</span> Review #
                      {r.id}
                    </p>
                    <div className="flex items-center gap-2">
                      <StarRow rating={r.rating} />
                      <span className="text-xs font-medium text-textMain/50">
                        {r.rating}/5
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-textMain/85">
                      {r.comment}
                    </p>
                    {imgs.length > 0 ? (
                      <ul className="flex flex-wrap gap-2 pt-1">
                        {imgs.map((url) => (
                          <li key={url}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-xl border border-primary/10 shadow-sm transition hover:border-primary/25"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt=""
                                className="h-14 w-14 object-cover"
                              />
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {r.admin_reply ? (
                      <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-textMain/85">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                          Current reply
                        </p>
                        <p className="mt-1.5 leading-relaxed">{r.admin_reply}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-primary/15 bg-background px-3.5 py-2.5 shadow-sm transition hover:border-primary/25">
                      <span className="text-xs font-semibold text-textMain/75">
                        Public
                      </span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-primary/25 text-primary focus:ring-2 focus:ring-primary/30"
                        checked={r.is_approved}
                        disabled={busy}
                        onChange={(e) =>
                          void setApproved(r.id, e.target.checked)
                        }
                        aria-label={
                          r.is_approved ? "Reject review" : "Approve review"
                        }
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        replyFor === r.id
                          ? (setReplyFor(null), setReplyDraft(""))
                          : openReply(r)
                      }
                      className="rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs font-semibold text-textMain transition hover:border-primary/30 hover:bg-primary/10 active:scale-[0.98] disabled:opacity-50"
                    >
                      {replyFor === r.id ? "Cancel reply" : "Reply"}
                    </button>
                  </div>
                </div>

                {replyFor === r.id ? (
                  <div className="mt-5 border-t border-primary/10 pt-5">
                    <label
                      htmlFor={`reply-${r.id}`}
                      className="text-xs font-semibold uppercase tracking-wider text-textMain/55"
                    >
                      Admin reply
                    </label>
                    <textarea
                      id={`reply-${r.id}`}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      rows={3}
                      placeholder="Write a response visible on the product page…"
                      className={textareaClass}
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void submitReply(r.id)}
                      className="mt-3 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                      Save reply
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
