"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

type OrderItemOut = {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  product_name?: string | null;
  variant_name?: string | null;
};

type OrderOut = {
  id: number;
  user_id: number;
  total_price: string | number;
  status: string;
  payment_status: string;
  is_cod: boolean;
  items: OrderItemOut[];
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

function itemLineTotal(it: OrderItemOut): number {
  const unit =
    typeof it.unit_price === "number"
      ? it.unit_price
      : Number.parseFloat(String(it.unit_price));
  const u = Number.isFinite(unit) ? unit : 0;
  return u * it.quantity;
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const placed = searchParams.get("placed") === "1";

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [orders, setOrders] = useState<OrderOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      useAuthStore.getState().initAuth();

      if (!useAuthStore.getState().isAuthenticated) {
        if (!cancelled) {
          setOrders([]);
          setError("");
          setLoading(false);
          setBootstrapped(true);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError("");
      }

      try {
        const { data } = await api.get<OrderOut[]>("/orders");
        if (!cancelled) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load orders.");
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setBootstrapped(true);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!bootstrapped) {
    return (
      <main className="mx-auto max-w-6xl flex-1 px-4 py-12">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
        Your orders
      </h1>

      {placed && (
        <p
          className="mt-4 rounded-md border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200"
          role="status"
        >
          Order placed successfully! Details below.
        </p>
      )}

      {!isAuthenticated && (
        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-950 px-6 py-10 text-center">
          <p className="text-sm text-zinc-400">Sign in to view your orders.</p>
          <Link
            href="/login?next=/orders"
            className="mt-4 inline-block text-sm font-medium text-zinc-50 underline decoration-zinc-600 underline-offset-4 hover:decoration-zinc-400"
          >
            Sign in
          </Link>
        </div>
      )}

      {isAuthenticated && loading && (
        <p className="mt-8 text-sm text-zinc-500">Loading orders…</p>
      )}

      {isAuthenticated && !loading && error && (
        <p className="mt-8 text-sm text-red-300">{error}</p>
      )}

      {isAuthenticated && !loading && !error && orders.length === 0 && !placed && (
        <p className="mt-8 text-sm text-zinc-500">No orders yet.</p>
      )}

      {isAuthenticated && !loading && orders.length > 0 && (
        <ul className="mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex h-full w-full flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-6"
            >
              <div className="mb-2 flex items-start justify-between">
                <span className="text-sm font-semibold text-zinc-100">
                  Order #{order.id}
                </span>
                <span className="text-xs uppercase tracking-wider text-zinc-400">
                  {order.status} · {order.is_cod ? "COD" : "Card"} ·{" "}
                  {order.payment_status === "paid" ? "Paid" : "Unpaid"}
                </span>
              </div>

              <div className="flex flex-1 flex-col border-t border-zinc-800">
                <div className="flex flex-col gap-2 py-2">
                  {order.items.map((it) => {
                    const label =
                      it.product_name?.trim() || `Product #${it.product_id}`;
                    return (
                      <div
                        key={it.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="text-zinc-300">
                            {label}
                            <span className="ml-1 text-zinc-500">
                              × {it.quantity}
                            </span>
                          </div>
                          {it.variant_name ? (
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {it.variant_name}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 tabular-nums text-zinc-400">
                          {formatMoney(itemLineTotal(it))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium tabular-nums text-zinc-100">
                  Total: {formatMoney(order.total_price)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-900"
                  >
                    View order
                  </Link>
                  <Link
                    href={`/orders/${order.id}/receipt`}
                    className="inline-flex items-center rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
                  >
                    Receipt 🧾
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10">
        <Link
          href="/products"
          className="text-sm font-medium text-zinc-400 underline-offset-4 hover:text-zinc-50 hover:underline"
        >
          Back to products
        </Link>
      </p>
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl flex-1 px-4 py-12">
          <p className="text-sm text-zinc-500">Loading…</p>
        </main>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
