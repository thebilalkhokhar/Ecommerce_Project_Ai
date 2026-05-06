"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import api from "@/lib/axios";
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

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cartHydrated = useCartStoreHydrated();

  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe" | "payflow">(
    "cod",
  );

  const [payflowCard, setPayflowCard] = useState("");
  const [payflowExpiry, setPayflowExpiry] = useState("");
  const [payflowCvv, setPayflowCvv] = useState("");

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
      <main className="mx-auto max-w-6xl flex-1 px-4 py-12">
        <nav className="mb-8 text-sm text-textMain/60">
          <Link href="/cart" className="hover:text-textMain/80">
            Cart
          </Link>
          <span className="mx-2 text-textMain/40">/</span>
          <span className="text-textMain/70">Checkout</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-textMain">
          Checkout
        </h1>
        <p className="mt-6 text-sm text-textMain/60">Restoring your cart…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-12">
      <nav className="mb-8 text-sm text-textMain/60">
        <Link href="/cart" className="hover:text-textMain/80">
          Cart
        </Link>
        <span className="mx-2 text-textMain/40">/</span>
        <span className="text-textMain/70">Checkout</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight text-textMain">
        Checkout
      </h1>
      <p className="mt-1 text-sm text-textMain/60">
        Review your order and choose how you&apos;ll pay.
      </p>

      {checkoutError && (
        <p
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {checkoutError}
        </p>
      )}

      {items.length === 0 ? (
        <div className="mt-10 rounded-lg border border-gray-200 bg-surface px-6 py-14 text-center">
          <p className="text-sm text-textMain/70">Your cart is empty.</p>
          <Link
            href="/products"
            className="mt-6 inline-block text-sm font-medium text-textMain underline decoration-textMain/35 underline-offset-4 hover:decoration-primary"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-surface">
              <h2 className="border-b border-gray-200 px-5 py-4 text-sm font-medium uppercase tracking-wider text-textMain/60">
                Items
              </h2>
              <ul className="divide-y divide-gray-200">
                {items.map((line) => (
                  <li key={`${line.product.id}::${line.product.variant_name ?? ""}`} className="px-5 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium text-textMain">{line.product.name}</p>
                      <p className="text-sm tabular-nums text-textMain/80">
                        {formatMoney(line.product.price * line.quantity)}
                      </p>
                    </div>
                    {line.product.variant_name ? (
                      <p className="mt-2">
                        <span className="inline-block rounded bg-gray-50 px-2 py-1 text-xs text-textMain/70">
                          {line.product.variant_name}
                        </span>
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-textMain/60">
                      Qty {line.quantity} × {formatMoney(line.product.price)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              <div className="rounded-lg border border-gray-200 bg-surface p-6">
                <h2 className="text-sm font-medium uppercase tracking-wider text-textMain/60">
                  Order summary
                </h2>
                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between text-textMain/70">
                    <dt>Subtotal</dt>
                    <dd className="tabular-nums text-textMain">
                      {formatMoney(subtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-textMain/70">
                    <dt>Shipping</dt>
                    <dd className="text-textMain">{shippingLabel}</dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-medium text-textMain">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatMoney(orderTotal)}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-gray-200 bg-surface p-6">
                <h2 className="text-lg font-medium text-textMain mb-4">
                  Payment method
                </h2>
                <div className="flex flex-col gap-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-300 bg-gray-50 p-4 transition hover:border-gray-400 has-checked:border-primary/50 has-checked:bg-primary/5">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="mt-1 h-4 w-4 shrink-0 border-gray-300 bg-gray-50 text-textMain focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-surface"
                    />
                    <span>
                      <span className="block text-sm font-medium text-textMain">
                        Cash on Delivery
                      </span>
                      <span className="mt-0.5 block text-xs text-textMain/70">
                        Pay when your order arrives.
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-300 bg-gray-50 p-4 transition hover:border-gray-400 has-checked:border-primary/50 has-checked:bg-primary/5">
                    <input
                      type="radio"
                      name="payment"
                      value="stripe"
                      checked={paymentMethod === "stripe"}
                      onChange={() => setPaymentMethod("stripe")}
                      className="mt-1 h-4 w-4 shrink-0 border-gray-300 bg-gray-50 text-textMain focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-surface"
                    />
                    <span>
                      <span className="block text-sm font-medium text-textMain">
                        Credit / Debit Card (Stripe)
                      </span>
                      <span className="mt-0.5 block text-xs text-textMain/70">
                        Secure payment via Stripe Checkout.
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-300 bg-gray-50 p-4 transition hover:border-gray-400 has-checked:border-primary/50 has-checked:bg-primary/5">
                    <input
                      type="radio"
                      name="payment"
                      value="payflow"
                      checked={paymentMethod === "payflow"}
                      onChange={() => setPaymentMethod("payflow")}
                      className="mt-1 h-4 w-4 shrink-0 border-gray-300 bg-gray-50 text-textMain focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-surface"
                    />
                    <span>
                      <span className="block text-sm font-medium text-textMain">
                        Credit Card (Payflow)
                      </span>
                      <span className="mt-0.5 block text-xs text-textMain/70">
                        PayPal Payflow Pro — card processed on our servers.
                      </span>
                    </span>
                  </label>
                </div>

                {payflowSelected && (
                  <div className="mt-5 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs text-textMain/60">
                      Enter your card details exactly as shown on the card. Expiry as
                      MMYY (e.g. 1226).
                    </p>
                    <div>
                      <label
                        htmlFor="payflow-card"
                        className="block text-xs font-medium uppercase tracking-wider text-textMain/60"
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
                        className="mt-1.5 w-full rounded-md border border-gray-300 bg-surface px-3 py-2 text-sm text-textMain placeholder:text-textMain/50 focus:border-primary focus:outline-none focus:ring-0"
                        placeholder="0000 0000 0000 0000"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="payflow-exp"
                          className="block text-xs font-medium uppercase tracking-wider text-textMain/60"
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
                            setPayflowExpiry(e.target.value.replace(/\D/g, "").slice(0, 4))
                          }
                          className="mt-1.5 w-full rounded-md border border-gray-300 bg-surface px-3 py-2 text-sm text-textMain placeholder:text-textMain/50 focus:border-primary focus:outline-none focus:ring-0"
                          placeholder="MMYY"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="payflow-cvv"
                          className="block text-xs font-medium uppercase tracking-wider text-textMain/60"
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
                            setPayflowCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                          }
                          className="mt-1.5 w-full rounded-md border border-gray-300 bg-surface px-3 py-2 text-sm text-textMain placeholder:text-textMain/50 focus:border-primary focus:outline-none focus:ring-0"
                          placeholder="•••"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={submitting || items.length === 0}
                onClick={() => void handlePlaceOrder()}
                className="w-full rounded-md bg-primary py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting
                  ? paymentMethod === "stripe"
                    ? "Redirecting…"
                    : paymentMethod === "payflow"
                      ? "Processing…"
                      : "Placing order…"
                  : paymentMethod === "stripe"
                    ? "Continue to payment"
                    : paymentMethod === "payflow"
                      ? "Pay with card"
                      : "Place order"}
              </button>

              {!isAuthenticated && items.length > 0 && (
                <p className="text-center text-xs text-textMain/60">
                  You&apos;ll be asked to sign in when you place the order.
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
