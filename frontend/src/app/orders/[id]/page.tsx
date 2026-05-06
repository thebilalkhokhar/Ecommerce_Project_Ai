"use client";

import Link from "next/link";
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useState,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Package, X } from "lucide-react";
import api from "@/lib/axios";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { useAuthStore } from "@/store/authStore";

type OrderItemRow = {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  variant_name?: string | null;
  product_name?: string | null;
  product_image_url?: string | null;
  has_reviewed?: boolean;
};

type OrderUserRow = {
  id: number;
  email: string;
  full_name?: string | null;
  phone_number?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
};

type OrderDetailData = {
  id: number;
  user_id: number;
  total_price: string | number;
  status: string;
  payment_status: string;
  is_cod: boolean;
  created_at?: string | null;
  user?: OrderUserRow | null;
  items: OrderItemRow[];
};

function formatMoney(value: string | number): string {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

function lineTotal(it: OrderItemRow): number {
  const unit =
    typeof it.unit_price === "number"
      ? it.unit_price
      : Number.parseFloat(String(it.unit_price));
  const u = Number.isFinite(unit) ? unit : 0;
  return u * it.quantity;
}

function statusBadgeClass(status: string): string {
  const s = normalizeOrderStatus(status);
  if (s === "delivered") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
  if (s === "cancelled") {
    return "bg-red-50 text-red-800 ring-red-200";
  }
  if (s === "shipped") {
    return "bg-secondary/15 text-textMain ring-secondary/40";
  }
  if (s === "processing") {
    return "bg-primary/10 text-primary ring-primary/25";
  }
  return "bg-textMain/5 text-textMain/80 ring-textMain/15";
}

function formatStatusLabel(status: string): string {
  const raw = normalizeOrderStatus(status);
  if (!raw) return "—";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function canWriteReviewForOrder(status: string): boolean {
  const s = normalizeOrderStatus(status);
  return s === "delivered";
}

/** Normalize API status (string or rare object shape) for comparisons. */
function normalizeOrderStatus(status: unknown): string {
  if (status == null) return "";
  if (typeof status === "string") return status.toLowerCase().trim();
  if (
    typeof status === "object" &&
    status !== null &&
    "value" in status &&
    typeof (status as { value: unknown }).value === "string"
  ) {
    return String((status as { value: string }).value).toLowerCase().trim();
  }
  return String(status).toLowerCase().trim();
}

function getReviewLockReason(statusUnknown: unknown): string {
  const s = normalizeOrderStatus(statusUnknown);
  if (s === "cancelled") {
    return "Reviews are not available for cancelled orders.";
  }
  const label = formatStatusLabel(String(statusUnknown));
  return `Write a review becomes available when your order is delivered. Current status: ${label}.`;
}

function OrderDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reviewTitleId = useId();
  const idParam = params.id;
  const orderId =
    typeof idParam === "string" ? idParam : Array.isArray(idParam) ? idParam[0] : "";

  const [authReady, setAuthReady] = useState(false);
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paySuccessToast, setPaySuccessToast] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);

  const closeReviewModal = useCallback(() => setReviewProductId(null), []);

  const refreshOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const { data } = await api.get<OrderDetailData>(`/orders/${orderId}`);
      setOrder(data);
    } catch {
      /* keep existing order snapshot */
    }
  }, [orderId]);

  useEffect(() => {
    useAuthStore.getState().initAuth();
    if (!orderId) return;
    if (!useAuthStore.getState().isAuthenticated) {
      router.replace(`/login?next=/orders/${orderId}`);
      return;
    }
    queueMicrotask(() => {
      setAuthReady(true);
    });
  }, [orderId, router]);

  useEffect(() => {
    if (searchParams.get("success") !== "true" || !orderId) return;

    queueMicrotask(() => {
      setPaySuccessToast(true);
    });
    window.history.replaceState(null, "", `/orders/${orderId}`);
    const timer = window.setTimeout(() => setPaySuccessToast(false), 5000);
    return () => window.clearTimeout(timer);
  }, [searchParams, orderId]);

  useEffect(() => {
    if (!authReady || !orderId) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get<OrderDetailData>(`/orders/${orderId}`);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) {
          let msg = "Could not load order.";
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            msg = "Order not found.";
          }
          setError(msg);
          setOrder(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, orderId]);

  useEffect(() => {
    if (reviewProductId === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeReviewModal();
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [reviewProductId, closeReviewModal]);

  if (!orderId) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-sm text-textMain/60">Invalid order.</p>
        </div>
      </main>
    );
  }

  if (!authReady) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-sm text-textMain/60">Loading…</p>
        </div>
      </main>
    );
  }

  const subtotal =
    order?.items.reduce((sum, it) => sum + lineTotal(it), 0) ?? 0;
  const totalNum =
    order != null
      ? typeof order.total_price === "number"
        ? order.total_price
        : Number.parseFloat(String(order.total_price))
      : 0;
  const showReviewCta = order ? canWriteReviewForOrder(order.status) : false;
  const reviewLockReason =
    order && !showReviewCta ? getReviewLockReason(order.status) : null;

  return (
    <main className="relative min-h-screen bg-background">
      {paySuccessToast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-900 shadow-lg transition-opacity duration-200"
          role="status"
        >
          Payment successful!
        </div>
      )}

      {reviewProductId !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-textMain/40 transition-opacity duration-200"
            aria-label="Close review dialog"
            onClick={closeReviewModal}
          />
          <div
            className="relative z-10 w-full max-w-lg max-h-[min(90vh,640px)] overflow-y-auto rounded-2xl border border-textMain/10 bg-surface shadow-xl transition-all duration-200 ease-out"
            role="dialog"
            aria-modal="true"
            aria-labelledby={reviewTitleId}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-textMain/8 bg-surface px-5 py-4">
              <h2
                id={reviewTitleId}
                className="text-lg font-semibold text-textMain"
              >
                Write a review
              </h2>
              <button
                type="button"
                onClick={closeReviewModal}
                className="rounded-lg p-2 text-textMain/55 transition-colors hover:bg-textMain/5 hover:text-textMain"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="p-5">
              <ReviewForm
                key={reviewProductId}
                productId={reviewProductId}
                onSuccess={async () => {
                  closeReviewModal();
                  await refreshOrder();
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <nav className="mb-6 text-sm text-textMain/55 transition-colors">
          <Link
            href="/orders"
            className="font-medium text-primary hover:text-primary/90"
          >
            Orders
          </Link>
          <span className="mx-2 text-textMain/35">/</span>
          <span className="text-textMain/75">#{orderId}</span>
        </nav>

        {loading && (
          <p className="text-sm text-textMain/60">Loading order…</p>
        )}
        {error && !loading && (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        )}

        {order && !loading && (
          <div className="space-y-6 transition-opacity duration-200">
            <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-textMain md:text-3xl">
                  Order #{order.id}
                </h1>
                {order.created_at ? (
                  <p className="mt-1 text-sm text-textMain/55">
                    Placed{" "}
                    {new Date(order.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${statusBadgeClass(order.status)}`}
                >
                  {formatStatusLabel(order.status)}
                </span>
                <span className="rounded-full bg-textMain/5 px-3 py-1 text-xs font-medium text-textMain/70 ring-1 ring-textMain/10">
                  {order.is_cod ? "Cash on delivery" : "Card payment"}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                    order.payment_status === "paid"
                      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                      : "bg-amber-50 text-amber-900 ring-amber-200"
                  }`}
                >
                  {order.payment_status === "paid" ? "Paid" : "Unpaid"}
                </span>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
              <section className="space-y-6 lg:col-span-3">
                <div className="rounded-xl border border-textMain/10 bg-surface p-5 shadow-sm md:p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-textMain/55">
                    Items in this order
                  </h2>
                  <ul className="mt-5 divide-y divide-textMain/8">
                    {order.items.map((it) => {
                      const label =
                        it.product_name?.trim() || `Product #${it.product_id}`;
                      const img = it.product_image_url?.trim();
                      return (
                        <li key={it.id} className="flex gap-4 py-5 first:pt-0">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-textMain/10 bg-background">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element -- product CDN / arbitrary URLs
                              <img
                                src={img}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-textMain/35">
                                <Package className="h-8 w-8" strokeWidth={1.25} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-medium text-textMain">
                                  {label}
                                </p>
                                {it.variant_name ? (
                                  <p className="mt-0.5 text-xs text-textMain/55">
                                    {it.variant_name}
                                  </p>
                                ) : null}
                                <p className="mt-1 text-xs tabular-nums text-textMain/55">
                                  Qty {it.quantity} × {formatMoney(it.unit_price)}
                                </p>
                              </div>
                              <p className="shrink-0 text-sm font-semibold tabular-nums text-textMain">
                                {formatMoney(lineTotal(it))}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="rounded-xl border border-textMain/10 bg-surface p-5 shadow-sm md:p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-textMain/55">
                    Product reviews
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-textMain/65">
                    Rate what you bought. Submitted reviews are moderated before
                    they appear on the product page.
                  </p>
                  {reviewLockReason ? (
                    <p
                      className="mt-4 rounded-lg border border-textMain/10 bg-background px-4 py-3 text-sm text-textMain/80"
                      role="status"
                    >
                      {reviewLockReason}
                    </p>
                  ) : null}
                  <ul className="mt-5 divide-y divide-textMain/8">
                    {order.items.map((it) => {
                      const label =
                        it.product_name?.trim() || `Product #${it.product_id}`;
                      const img = it.product_image_url?.trim();
                      return (
                        <li
                          key={`review-${it.id}`}
                          className="flex flex-col gap-3 py-5 first:pt-0 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 flex-1 gap-3">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-textMain/10 bg-background">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={img}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-textMain/35">
                                  <Package className="h-6 w-6" strokeWidth={1.25} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-textMain">
                                {label}
                              </p>
                              {it.variant_name ? (
                                <p className="text-xs text-textMain/55">
                                  {it.variant_name}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          {it.has_reviewed ? (
                            <span
                              className="inline-flex shrink-0 items-center rounded-lg border border-emerald-200/90 bg-emerald-50 px-3 py-2 text-xs font-semibold text-green-700"
                              aria-label="You already reviewed this product"
                            >
                              ✓ Reviewed
                            </span>
                          ) : showReviewCta ? (
                            <button
                              type="button"
                              onClick={() =>
                                setReviewProductId(it.product_id)
                              }
                              className="shrink-0 rounded-lg border border-primary/35 bg-surface px-4 py-2 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-primary/8"
                            >
                              Write a review
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>

              <aside className="space-y-6 lg:col-span-2">
                <div className="rounded-xl border border-textMain/10 bg-surface p-5 shadow-sm md:p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-textMain/55">
                    Order summary
                  </h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4 text-textMain/80">
                      <dt>Subtotal</dt>
                      <dd className="tabular-nums font-medium text-textMain">
                        {formatMoney(subtotal)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 text-textMain/80">
                      <dt>Shipping</dt>
                      <dd className="text-textMain/65">Included in total</dd>
                    </div>
                    <div className="flex justify-between gap-4 text-textMain/80">
                      <dt>Tax</dt>
                      <dd className="text-textMain/65">—</dd>
                    </div>
                    <div className="border-t border-textMain/8 pt-3 flex justify-between gap-4 text-base font-semibold text-textMain">
                      <dt>Total</dt>
                      <dd className="tabular-nums text-primary">
                        {formatMoney(
                          Number.isFinite(totalNum) ? totalNum : subtotal,
                        )}
                      </dd>
                    </div>
                  </dl>
                  <Link
                    href={`/orders/${order.id}/receipt`}
                    className="mt-5 inline-flex text-sm font-medium text-primary transition-colors hover:text-primary/90"
                  >
                    View receipt →
                  </Link>
                </div>

                <div className="rounded-xl border border-textMain/10 bg-surface p-5 shadow-sm md:p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-textMain/55">
                    Shipping information
                  </h2>
                  {order.user ? (
                    <address className="mt-4 not-italic text-sm leading-relaxed text-textMain/85">
                      <p className="font-medium text-textMain">
                        {order.user.full_name || "—"}
                      </p>
                      <p className="mt-2">{order.user.email}</p>
                      {order.user.phone_number ? (
                        <p className="mt-1">{order.user.phone_number}</p>
                      ) : null}
                      <p className="mt-3 text-textMain/75">
                        {order.user.address_line_1}
                        {order.user.address_line_2 ? (
                          <>
                            <br />
                            {order.user.address_line_2}
                          </>
                        ) : null}
                      </p>
                      <p className="mt-1 text-textMain/75">
                        {[order.user.city, order.user.state]
                          .filter(Boolean)
                          .join(", ")}
                        {order.user.postal_code
                          ? ` ${order.user.postal_code}`
                          : ""}
                      </p>
                    </address>
                  ) : (
                    <p className="mt-4 text-sm text-textMain/55">
                      Address on file is not available for this order.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <p className="text-sm text-textMain/60">Loading…</p>
          </div>
        </main>
      }
    >
      <OrderDetailContent />
    </Suspense>
  );
}
