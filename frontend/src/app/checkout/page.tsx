"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Loader2, ShoppingBag } from "lucide-react";
import api from "@/lib/axios";
import { CartLineThumbnail } from "@/components/cart/CartLineThumbnail";
import { CheckoutPayPalEmbed } from "@/components/CheckoutPayPalEmbed";
import { useCartStoreHydrated } from "@/components/CartStoreProvider";
import { useAuthStore } from "@/store/authStore";
import { useCartStore, type CartItem } from "@/store/cartStore";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function apiErrorMessage(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return "Network error. Is the API running?";
  }
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((item: unknown) => {
      if (item && typeof item === "object" && "msg" in item) {
        return String((item as { msg: string }).msg);
      }
      return JSON.stringify(item);
    });
    if (parts.length) return parts.join(" ");
  }
  return "Could not complete request. Try again.";
}

type OrderCreatedResponse = {
  id: number;
  total_price?: string | number;
  status?: string;
  payment_status?: string;
  is_cod?: boolean;
  items?: unknown[];
};

const paymentRadioClass =
  "flex cursor-pointer items-start gap-3 rounded-2xl border border-primary/15 bg-background p-4 transition-all hover:border-primary/25 has-checked:border-primary/40 has-checked:bg-primary/5 has-checked:shadow-sm";

const paymentRadioInputClass =
  "mt-1 h-4 w-4 shrink-0 border-primary/25 bg-surface text-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-surface";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cartHydrated = useCartStoreHydrated();

  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cod" | "stripe" | "payflow" | "paypal"
  >("cod");

  const [payflowCard, setPayflowCard] = useState("");
  const [payflowExpiry, setPayflowExpiry] = useState("");
  const [payflowCvv, setPayflowCvv] = useState("");
  const [paypalCheckoutOrderId, setPaypalCheckoutOrderId] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (paymentMethod !== "paypal") {
      setPaypalCheckoutOrderId(null);
    }
  }, [paymentMethod]);

  const subtotal = totalPrice;
  const shippingLabel = "Free";
  const orderTotal = subtotal;

  async function handlePlaceOrder() {
    useAuthStore.getState().initAuth();
    setCheckoutError("");

    if (!useAuthStore.getState().isAuthenticated) {
      toast.error("Please sign in to place your order.");
      router.push("/login?next=/checkout&reason=checkout");
      return;
    }

    if (items.length === 0) {
      const msg = "Your cart is empty.";
      setCheckoutError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Placing your order…");

    let payflowBody: {
      card_number: string;
      expiry_date: string;
      cvv: string;
    } | null = null;
    if (paymentMethod === "payflow") {
      const card_number = payflowCard.replace(/\s+/g, "");
      const expiry_date = payflowExpiry.trim();
      const cvv = payflowCvv.trim();
      if (!card_number || expiry_date.length !== 4 || !cvv) {
        const msg = "Enter card number, expiry as MMYY, and CVV.";
        toast.error(msg, { id: toastId });
        setCheckoutError(msg);
        setSubmitting(false);
        return;
      }
      payflowBody = { card_number, expiry_date, cvv };
    }

    try {
      const payload = {
        items: items.map((item: CartItem) => {
          const row: {
            product_id: number;
            quantity: number;
            variant_name?: string;
          } = {
            product_id: item.product.id,
            quantity: item.quantity,
          };
          if (item.product.variant_name) {
            row.variant_name = item.product.variant_name;
          }
          return row;
        }),
        is_cod: paymentMethod === "cod",
      };

      if (paymentMethod === "paypal") {
        const { data: paypalOrder } = await api.post<OrderCreatedResponse>(
          "/orders",
          payload,
        );
        setPaypalCheckoutOrderId(paypalOrder.id);
        toast.success("Order created. Complete payment with PayPal below.", {
          id: toastId,
        });
        return;
      }

      const { data: order } = await api.post<OrderCreatedResponse>(
        "/orders",
        payload,
      );

      if (paymentMethod === "stripe") {
        toast.loading("Redirecting to secure checkout…", { id: toastId });
        const { data: session } = await api.post<{ url: string }>(
          `/payments/create-checkout-session/${order.id}`,
          {},
        );
        if (!session?.url) {
          throw new Error("No checkout URL returned");
        }
        clearCart();
        window.location.href = session.url;
        return;
      }

      if (paymentMethod === "payflow" && payflowBody) {
        toast.loading("Processing card payment…", { id: toastId });
        await api.post(`/payments/payflow-checkout/${order.id}`, payflowBody);
        toast.success("Payment successful!", { id: toastId });
        clearCart();
        setPayflowCard("");
        setPayflowExpiry("");
        setPayflowCvv("");
        router.push(`/orders/${order.id}?success=true`);
        return;
      }

      toast.success("Order placed successfully!", { id: toastId });
      clearCart();
      router.push("/orders?placed=1");
    } catch (err: unknown) {
      const msg = apiErrorMessage(err);
      toast.error(msg, { id: toastId });
      setCheckoutError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const payflowSelected = paymentMethod === "payflow";

  if (!cartHydrated) {
    return (
      <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col px-4 py-8">
        <nav
          className="mb-8 flex flex-wrap items-center gap-2 text-sm"
          aria-label="Breadcrumb"
        >
          <Link
            href="/cart"
            className="rounded-lg px-2 py-1 text-textMain/65 transition-colors hover:bg-primary/5 hover:text-primary"
          >
            Cart
          </Link>
          <span className="text-textMain/35" aria-hidden>
            /
          </span>
          <span className="font-medium text-textMain">Checkout</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-textMain md:text-3xl">
          Checkout
        </h1>
        <div
          className="mt-10 flex flex-col items-center justify-center gap-4 rounded-2xl border border-primary/10 bg-surface px-8 py-16 shadow-sm"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2
            className="h-8 w-8 animate-spin text-primary"
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="text-sm text-textMain/60">Restoring your cart…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-8">
      <nav
        className="mb-8 flex flex-wrap items-center gap-2 text-sm"
        aria-label="Breadcrumb"
      >
        <Link
          href="/cart"
          className="rounded-lg px-2 py-1 text-textMain/65 transition-colors hover:bg-primary/5 hover:text-primary"
        >
          Cart
        </Link>
        <span className="text-textMain/35" aria-hidden>
          /
        </span>
        <span className="font-medium text-textMain">Checkout</span>
      </nav>

      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
        Secure checkout
      </span>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-textMain md:text-3xl">
        Checkout
      </h1>
      <p className="mt-2 max-w-2xl text-base text-textMain/70">
        Review your items, confirm payment, and finish your order. You must be
        signed in to place an order.
      </p>

      {checkoutError && (
        <p
          className="mt-6 rounded-2xl border border-red-200/80 bg-red-50 px-5 py-4 text-sm leading-relaxed text-red-800"
          role="alert"
        >
          {checkoutError}
        </p>
      )}

      {items.length === 0 ? (
        <div className="mt-10 flex w-full flex-col items-center rounded-2xl border border-primary/10 bg-surface px-6 py-16 text-center shadow-sm md:py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="h-7 w-7" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="mt-6 text-base font-medium text-textMain">
            Your cart is empty
          </p>
          <p className="mt-2 max-w-sm text-sm text-textMain/60">
            Add products before you can check out.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.98]"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid w-full min-w-0 grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="min-w-0 lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-textMain/50">
              Items in your order
            </h2>
            <ul className="mt-4 flex w-full flex-col gap-4" aria-label="Order items">
              {items.map((line) => (
                <li
                  key={`${line.product.id}::${line.product.variant_name ?? ""}`}
                  className="min-w-0"
                >
                  <div className="rounded-2xl border border-primary/10 bg-surface p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                      <CartLineThumbnail
                        productId={line.product.id}
                        name={line.product.name}
                        imageUrl={line.product.image_url}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-base font-semibold leading-snug text-textMain">
                            {line.product.name}
                          </p>
                          <p className="shrink-0 text-sm font-medium tabular-nums text-textMain">
                            {formatMoney(line.product.price * line.quantity)}
                          </p>
                        </div>
                        {line.product.variant_name ? (
                          <p className="mt-2">
                            <span className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-textMain/80">
                              {line.product.variant_name}
                            </span>
                          </p>
                        ) : null}
                        <p className="mt-3 text-xs text-textMain/60">
                          Qty {line.quantity} × {formatMoney(line.product.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside className="min-w-0 lg:col-span-1">
            <div className="sticky top-24 space-y-6 md:top-28">
              <div className="rounded-2xl border border-primary/10 bg-surface p-6 shadow-sm md:p-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-textMain/50">
                  Order summary
                </h2>
                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 text-textMain/70">
                    <dt>Subtotal</dt>
                    <dd className="tabular-nums font-medium text-textMain">
                      {formatMoney(subtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 text-textMain/70">
                    <dt>Shipping</dt>
                    <dd className="font-medium text-emerald-700">
                      {shippingLabel}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-primary/10 pt-4 text-base font-semibold text-textMain">
                    <dt>Estimated total</dt>
                    <dd className="tabular-nums">{formatMoney(orderTotal)}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-surface p-6 shadow-sm md:p-8">
                <h2 className="text-lg font-semibold tracking-tight text-textMain">
                  Payment method
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-textMain/60">
                  Totals are in PKR; PayPal Checkout charges in USD using a fixed
                  conversion rate on the server (see{" "}
                  <code className="rounded bg-primary/10 px-1 py-0.5 text-[11px] text-textMain/80">
                    PAYPAL_PKR_PER_USD
                  </code>{" "}
                  in the API).
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <label className={paymentRadioClass}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className={paymentRadioInputClass}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-textMain">
                        Cash on Delivery
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-textMain/70">
                        Pay when your order arrives.
                      </span>
                    </span>
                  </label>

                  <label className={paymentRadioClass}>
                    <input
                      type="radio"
                      name="payment"
                      value="stripe"
                      checked={paymentMethod === "stripe"}
                      onChange={() => setPaymentMethod("stripe")}
                      className={paymentRadioInputClass}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-textMain">
                        Credit / Debit Card (Stripe)
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-textMain/70">
                        Secure payment via Stripe Checkout.
                      </span>
                    </span>
                  </label>

                  <label className={paymentRadioClass}>
                    <input
                      type="radio"
                      name="payment"
                      value="payflow"
                      checked={paymentMethod === "payflow"}
                      onChange={() => setPaymentMethod("payflow")}
                      className={paymentRadioInputClass}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-textMain">
                        Credit Card (Payflow)
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-textMain/70">
                        PayPal Payflow Pro — card processed on our servers.
                      </span>
                    </span>
                  </label>

                  <label className={paymentRadioClass}>
                    <input
                      type="radio"
                      name="payment"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={() => setPaymentMethod("paypal")}
                      className={paymentRadioInputClass}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-textMain">
                        PayPal
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-textMain/70">
                        Pay with your PayPal account or card (checkout in USD).
                      </span>
                    </span>
                  </label>
                </div>

                {payflowSelected && (
                  <div className="mt-5 space-y-4 rounded-2xl border border-primary/15 bg-background/80 p-4 md:p-5">
                    <p className="text-xs leading-relaxed text-textMain/60">
                      Enter your card details exactly as shown on the card. Expiry
                      as MMYY (e.g. 1226).
                    </p>
                    <div>
                      <label
                        htmlFor="payflow-card"
                        className="block text-xs font-medium uppercase tracking-wider text-textMain/55"
                      >
                        Card number
                      </label>
                      <input
                        id="payflow-card"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        maxLength={23}
                        value={payflowCard}
                        onChange={(e) => setPayflowCard(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-primary/15 bg-surface px-3 py-2.5 text-sm text-textMain shadow-sm transition-all placeholder:text-textMain/40 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10"
                        placeholder="0000 0000 0000 0000"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="payflow-exp"
                          className="block text-xs font-medium uppercase tracking-wider text-textMain/55"
                        >
                          Expiry (MMYY)
                        </label>
                        <input
                          id="payflow-exp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          maxLength={4}
                          value={payflowExpiry}
                          onChange={(e) =>
                            setPayflowExpiry(
                              e.target.value.replace(/\D/g, "").slice(0, 4),
                            )
                          }
                          className="mt-1.5 w-full rounded-xl border border-primary/15 bg-surface px-3 py-2.5 text-sm text-textMain shadow-sm transition-all placeholder:text-textMain/40 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10"
                          placeholder="MMYY"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="payflow-cvv"
                          className="block text-xs font-medium uppercase tracking-wider text-textMain/55"
                        >
                          CVV
                        </label>
                        <input
                          id="payflow-cvv"
                          type="password"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          maxLength={4}
                          value={payflowCvv}
                          onChange={(e) =>
                            setPayflowCvv(
                              e.target.value.replace(/\D/g, "").slice(0, 4),
                            )
                          }
                          className="mt-1.5 w-full rounded-xl border border-primary/15 bg-surface px-3 py-2.5 text-sm text-textMain shadow-sm transition-all placeholder:text-textMain/40 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10"
                          placeholder="•••"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "paypal" && paypalCheckoutOrderId !== null && (
                  <div className="mt-5 rounded-2xl border border-primary/15 bg-background/80 p-4 md:p-5">
                    <p className="mb-3 text-xs font-semibold text-textMain/70">
                      Complete payment with PayPal
                    </p>
                    <CheckoutPayPalEmbed orderId={paypalCheckoutOrderId} />
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={
                  submitting ||
                  items.length === 0 ||
                  (paymentMethod === "paypal" && paypalCheckoutOrderId !== null)
                }
                onClick={() => void handlePlaceOrder()}
                className="w-full rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100"
              >
                {submitting
                  ? paymentMethod === "stripe"
                    ? "Redirecting…"
                    : paymentMethod === "payflow"
                      ? "Processing…"
                      : paymentMethod === "paypal"
                        ? "Creating order…"
                        : "Placing order…"
                  : paymentMethod === "stripe"
                    ? "Continue to payment"
                    : paymentMethod === "payflow"
                      ? "Pay with card"
                      : paymentMethod === "paypal" && paypalCheckoutOrderId !== null
                        ? "Use PayPal button below"
                        : paymentMethod === "paypal"
                          ? "Create order & continue with PayPal"
                          : "Place order"}
              </button>

              {!isAuthenticated && items.length > 0 && (
                <p className="text-center text-xs leading-relaxed text-textMain/55">
                  You&apos;ll be asked to sign in when you place the order.
                </p>
              )}

              <Link
                href="/cart"
                className="block w-full rounded-2xl border border-primary/20 bg-primary/5 py-3 text-center text-sm font-medium text-textMain transition-all hover:border-primary/30 hover:bg-primary/10 active:scale-[0.98]"
              >
                Back to cart
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
