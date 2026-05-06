"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import { Minus, Plus, Trash2 } from "lucide-react";
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

function cartLineKey(line: CartItem): string {
  return `${line.product.id}::${line.product.variant_name ?? ""}`;
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const subtotal = totalPrice;
  const shippingLabel = "Free";
  const orderTotal = subtotal;

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-textMain">
        Cart
      </h1>
      <p className="mt-1 text-sm text-textMain/60">
        Adjust quantities, then continue to checkout to pay.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {items.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-surface px-6 py-14 text-center">
              <p className="text-sm text-textMain/70">Your cart is empty.</p>
              <Link
                href="/products"
                className="mt-6 inline-block text-sm font-medium text-textMain underline decoration-textMain/35 underline-offset-4 hover:decoration-primary"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-surface">
              {items.map((line) => (
                <li
                  key={cartLineKey(line)}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-textMain">{line.product.name}</p>
                    {line.product.variant_name ? (
                      <p className="mt-2">
                        <span className="inline-block rounded bg-gray-50 px-2 py-1 text-xs text-textMain/70">
                          {line.product.variant_name}
                        </span>
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm tabular-nums text-textMain/70">
                      {formatMoney(line.product.price)} each
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-md border border-gray-200">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          updateQuantity(
                            line.product.id,
                            line.quantity - 1,
                            line.product.variant_name,
                          )
                        }
                        className="p-2 text-textMain/70 transition hover:bg-gray-50 hover:text-textMain"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-8 text-center text-sm tabular-nums text-textMain">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() =>
                          updateQuantity(
                            line.product.id,
                            line.quantity + 1,
                            line.product.variant_name,
                          )
                        }
                        className="p-2 text-textMain/70 transition hover:bg-gray-50 hover:text-textMain"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      aria-label={`Remove ${line.product.name}`}
                      onClick={() => {
                        removeItem(
                          line.product.id,
                          line.product.variant_name,
                        );
                        const v = line.product.variant_name;
                        toast.success(
                          v
                            ? `${line.product.name} (${v}) removed from cart`
                            : `${line.product.name} removed from cart`,
                        );
                      }}
                      className="rounded-md border border-gray-200 p-2 text-textMain/60 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-4 rounded-lg border border-gray-200 bg-surface p-6 shadow-md">
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

            {items.length === 0 ? (
              <span
                className="mt-6 block w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 py-3 text-center text-sm font-medium text-textMain/50 opacity-50"
                aria-disabled
              >
                Proceed to checkout
              </span>
            ) : (
              <Link
                href="/checkout"
                className="mt-6 block w-full rounded-md bg-primary py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
              >
                Proceed to checkout
              </Link>
            )}

            {!isAuthenticated && items.length > 0 && (
              <p className="mt-3 text-center text-xs text-textMain/60">
                You&apos;ll sign in at checkout if needed.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
