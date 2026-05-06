"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Star } from "lucide-react";
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

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= rating
              ? "fill-secondary text-secondary"
              : "fill-none text-textMain/45"
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-textMain">
          Reviews
        </h1>
        <p className="mt-1 text-sm text-textMain/65">
          Approve customer reviews and post store replies. Pending reviews are
          hidden from the storefront.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-textMain/60">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-textMain/10 bg-surface p-8 text-sm text-textMain/60 shadow-sm">
          No reviews yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => {
            const busy = busyId === r.id;
            const imgs = Array.isArray(r.image_urls) ? r.image_urls : [];
            return (
              <li
                key={r.id}
                className="rounded-xl border border-textMain/10 bg-surface p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          r.is_approved
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-amber-50 text-amber-900"
                        }`}
                      >
                        {r.is_approved ? "Approved" : "Pending"}
                      </span>
                      {r.is_verified_purchase ? (
                        <span className="rounded-full bg-textMain/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-textMain/65">
                          Verified
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium text-textMain">
                      {r.product_name || `Product #${r.product_id}`}
                    </p>
                    <p className="text-xs text-textMain/55">
                      {r.user?.name?.trim() || "Customer"}{" "}
                      <span className="text-textMain/40">·</span> Review #
                      {r.id}
                    </p>
                    <div className="flex items-center gap-2">
                      <StarRow rating={r.rating} />
                      <span className="text-xs text-textMain/50">
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
                              className="block overflow-hidden rounded-md border border-textMain/10"
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
                      <div className="rounded-lg border border-textMain/8 bg-[#F4F4F8] p-3 text-sm text-textMain/80">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                          Current reply
                        </p>
                        <p className="mt-1">{r.admin_reply}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-textMain/10 bg-background px-3 py-2">
                      <span className="text-xs font-medium text-textMain/70">
                        Public
                      </span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-textMain/25 text-primary focus:ring-primary/35"
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
                      className="rounded-lg border border-textMain/15 bg-background px-3 py-2 text-xs font-medium text-textMain transition hover:border-primary/35 hover:text-primary disabled:opacity-50"
                    >
                      {replyFor === r.id ? "Cancel reply" : "Reply"}
                    </button>
                  </div>
                </div>

                {replyFor === r.id ? (
                  <div className="mt-4 border-t border-textMain/8 pt-4">
                    <label
                      htmlFor={`reply-${r.id}`}
                      className="text-xs font-medium uppercase tracking-wide text-textMain/55"
                    >
                      Admin reply
                    </label>
                    <textarea
                      id={`reply-${r.id}`}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      rows={3}
                      placeholder="Write a response visible on the product page…"
                      className="mt-2 w-full rounded-lg border border-textMain/12 bg-surface px-3 py-2 text-sm text-textMain placeholder:text-textMain/45 focus:border-primary/35 focus:outline-none focus:ring-1 focus:ring-primary/25"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void submitReply(r.id)}
                      className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
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
