"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { CartLineThumbnail } from "@/components/cart/CartLineThumbnail";
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

function cartLineKey(line: CartItem): string {
  return `${line.product.id}::${line.product.variant_name ?? ""}`;
}

function lineTotal(line: CartItem): number {
  return Math.round(line.product.price * line.quantity * 100) / 100;
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cartHydrated = useCartStoreHydrated();

  const subtotal = totalPrice;
  const shippingLabel = "Free";
  const orderTotal = subtotal;

  if (!cartHydrated) {
    return (
      <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-textMain md:text-3xl">
          Shopping cart
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
      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
        Your bag
      </span>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-textMain md:text-3xl">
        Shopping cart
      </h1>
      <p className="mt-2 max-w-2xl text-base text-textMain/70">
        Review your items and quantities. Shipping is shown as free for now; you
        can confirm everything at checkout.
      </p>

      <div className="mt-10 grid w-full min-w-0 grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="min-w-0 lg:col-span-2">
          {items.length === 0 ? (
            <div className="flex w-full flex-col items-center rounded-2xl border border-primary/10 bg-surface px-6 py-16 text-center shadow-sm md:py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShoppingBag className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="mt-6 text-base font-medium text-textMain">
                Your cart is empty
              </p>
              <p className="mt-2 max-w-sm text-sm text-textMain/60">
                Add something you love from the catalog — it&apos;ll show up here
                automatically.
              </p>
              <Link
                href="/products"
                className="mt-8 inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.98]"
              >
                Continue shopping
              </Link>
              <Link
                href="/categories"
                className="mt-3 text-sm font-medium text-textMain/70 underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                Browse categories
              </Link>
            </div>
          ) : (
            <ul className="flex w-full flex-col gap-4" aria-label="Cart items">
              {items.map((line) => (
                <li key={cartLineKey(line)} className="min-w-0">
                  <div className="rounded-2xl border border-primary/10 bg-surface p-4 shadow-sm transition-shadow hover:border-primary/15 hover:shadow-md sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                      <CartLineThumbnail
                        productId={line.product.id}
                        name={line.product.name}
                        imageUrl={line.product.image_url}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold leading-snug text-textMain">
                            {line.product.name}
                          </p>
                          {line.product.variant_name ? (
                            <p className="mt-2">
                              <span className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-textMain/80">
                                {line.product.variant_name}
                              </span>
                            </p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                            <span className="tabular-nums text-textMain/70">
                              {formatMoney(line.product.price)} each
                            </span>
                            <span className="text-textMain/40" aria-hidden>
                              ·
                            </span>
                            <span className="font-medium tabular-nums text-textMain">
                              Line: {formatMoney(lineTotal(line))}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center overflow-hidden rounded-2xl border border-primary/15 bg-background shadow-sm">
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
                              className="p-2.5 text-textMain/70 transition-colors hover:bg-primary/5 hover:text-textMain active:scale-95"
                            >
                              <Minus className="h-4 w-4" strokeWidth={2} />
                            </button>
                            <span className="min-w-10 px-1 text-center text-sm font-medium tabular-nums text-textMain">
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
                              className="p-2.5 text-textMain/70 transition-colors hover:bg-primary/5 hover:text-textMain active:scale-95"
                            >
                              <Plus className="h-4 w-4" strokeWidth={2} />
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
                            className="inline-flex items-center gap-2 rounded-2xl border border-transparent px-3 py-2 text-sm font-medium text-textMain/60 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-95"
                          >
                            <Trash2
                              className="h-4 w-4 shrink-0"
                              strokeWidth={1.75}
                            />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="min-w-0 lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-primary/10 bg-surface p-6 shadow-sm md:top-28 md:p-8">
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
                <dd className="font-medium text-emerald-700">{shippingLabel}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-primary/10 pt-4 text-base font-semibold text-textMain">
                <dt>Estimated total</dt>
                <dd className="tabular-nums">{formatMoney(orderTotal)}</dd>
              </div>
            </dl>

            {items.length === 0 ? (
              <span
                className="mt-8 block w-full cursor-not-allowed rounded-2xl border border-primary/15 bg-primary/5 px-6 py-3.5 text-center text-sm font-semibold text-textMain/45"
                aria-disabled
              >
                Proceed to checkout
              </span>
            ) : (
              <Link
                href="/checkout"
                className="mt-8 block w-full rounded-2xl bg-primary px-6 py-3.5 text-center text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.98]"
              >
                Proceed to checkout
              </Link>
            )}

            {!isAuthenticated && items.length > 0 && (
              <p className="mt-4 text-center text-xs leading-relaxed text-textMain/55">
                You can checkout as a guest or sign in when prompted — your cart
                stays on this device until you complete an order.
              </p>
            )}

            {items.length > 0 && (
              <Link
                href="/products"
                className="mt-6 block w-full rounded-2xl border border-primary/20 bg-primary/5 py-3 text-center text-sm font-medium text-textMain transition-all hover:border-primary/30 hover:bg-primary/10 active:scale-[0.98]"
              >
                Continue shopping
              </Link>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
