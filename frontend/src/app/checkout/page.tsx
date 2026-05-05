"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import api from "@/lib/axios";
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

  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">("cod");

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

      toast.success("Order placed successfully!", { id: toastId });
      clearCart();
      router.push("/orders?placed=1");
    } catch (err: unknown) {
      let msg = "Could not complete order. Try again.";
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string") {
          msg = detail;
        }
      } else {
        msg = "Network error. Is the API running?";
      }
      toast.error(msg, { id: toastId });
      setCheckoutError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-12">
      <nav className="mb-8 text-sm text-zinc-500">
        <Link href="/cart" className="hover:text-zinc-300">
          Cart
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <span className="text-zinc-400">Checkout</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
        Checkout
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Review your order and choose how you&apos;ll pay.
      </p>

      {checkoutError && (
        <p
          className="mt-6 rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {checkoutError}
        </p>
      )}

      {items.length === 0 ? (
        <div className="mt-10 rounded-lg border border-zinc-800 bg-zinc-950 px-6 py-14 text-center">
          <p className="text-sm text-zinc-400">Your cart is empty.</p>
          <Link
            href="/products"
            className="mt-6 inline-block text-sm font-medium text-zinc-50 underline decoration-zinc-600 underline-offset-4 hover:decoration-zinc-400"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950">
              <h2 className="border-b border-zinc-800 px-5 py-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
                Items
              </h2>
              <ul className="divide-y divide-zinc-800">
                {items.map((line) => (
                  <li key={`${line.product.id}::${line.product.variant_name ?? ""}`} className="px-5 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium text-zinc-50">{line.product.name}</p>
                      <p className="text-sm tabular-nums text-zinc-300">
                        {formatMoney(line.product.price * line.quantity)}
                      </p>
                    </div>
                    {line.product.variant_name ? (
                      <p className="mt-2">
                        <span className="inline-block rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-400">
                          {line.product.variant_name}
                        </span>
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-zinc-500">
                      Qty {line.quantity} × {formatMoney(line.product.price)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
                <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
                  Order summary
                </h2>
                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <dt>Subtotal</dt>
                    <dd className="tabular-nums text-zinc-200">
                      {formatMoney(subtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <dt>Shipping</dt>
                    <dd className="text-zinc-200">{shippingLabel}</dd>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-3 text-base font-medium text-zinc-50">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatMoney(orderTotal)}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
                <h2 className="text-lg font-medium text-zinc-50 mb-4">
                  Payment method
                </h2>
                <div className="flex flex-col gap-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-300 bg-zinc-800/50 p-4 transition hover:border-zinc-400 has-checked:border-zinc-200">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="mt-1 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-zinc-50 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                    />
                    <span>
                      <span className="block text-sm font-medium text-zinc-50">
                        Cash on Delivery
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-400">
                        Pay when your order arrives.
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-300 bg-zinc-800/50 p-4 transition hover:border-zinc-400 has-checked:border-zinc-200">
                    <input
                      type="radio"
                      name="payment"
                      value="stripe"
                      checked={paymentMethod === "stripe"}
                      onChange={() => setPaymentMethod("stripe")}
                      className="mt-1 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-zinc-50 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                    />
                    <span>
                      <span className="block text-sm font-medium text-zinc-50">
                        Credit / Debit Card (Stripe)
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-400">
                        Secure payment via Stripe Checkout.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                disabled={submitting || items.length === 0}
                onClick={handlePlaceOrder}
                className="w-full rounded-md border border-zinc-700 bg-zinc-50 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting
                  ? paymentMethod === "stripe"
                    ? "Redirecting…"
                    : "Placing order…"
                  : paymentMethod === "stripe"
                    ? "Continue to payment"
                    : "Place order"}
              </button>

              {!isAuthenticated && items.length > 0 && (
                <p className="text-center text-xs text-zinc-500">
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
