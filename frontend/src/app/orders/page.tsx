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
};

type OrderOut = {
  id: number;
  user_id: number;
  total_price: string | number;
  status: string;
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
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-lg border border-zinc-800 bg-zinc-950 p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-zinc-300">
                  Order #{order.id}
                </span>
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {order.status} · COD
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold tabular-nums text-zinc-50">
                {formatMoney(order.total_price)}
              </p>
              <ul className="mt-4 space-y-1 border-t border-zinc-800 pt-4 text-sm text-zinc-400">
                {order.items.map((it) => (
                  <li key={it.id}>
                    Product #{it.product_id} × {it.quantity} @{" "}
                    {formatMoney(it.unit_price)}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-4">
                <Link
                  href={`/orders/${order.id}/receipt`}
                  className="inline-flex items-center rounded-md border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"
                >
                  Receipt 🧾
                </Link>
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
