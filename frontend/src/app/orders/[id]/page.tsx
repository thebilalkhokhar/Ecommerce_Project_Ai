"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

type OrderItemRow = {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  variant_name?: string | null;
  product_name?: string | null;
};

type OrderDetailData = {
  id: number;
  user_id: number;
  total_price: string | number;
  status: string;
  payment_status: string;
  is_cod: boolean;
  created_at?: string | null;
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

function OrderDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const idParam = params.id;
  const orderId =
    typeof idParam === "string" ? idParam : Array.isArray(idParam) ? idParam[0] : "";

  const [authReady, setAuthReady] = useState(false);
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paySuccessToast, setPaySuccessToast] = useState(false);

  useEffect(() => {
    useAuthStore.getState().initAuth();
    if (!orderId) return;
    if (!useAuthStore.getState().isAuthenticated) {
      router.replace(`/login?next=/orders/${orderId}`);
      return;
    }
    setAuthReady(true);
  }, [orderId, router]);

  useEffect(() => {
    if (searchParams.get("success") !== "true" || !orderId) return;

    setPaySuccessToast(true);
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

  if (!orderId) {
    return (
      <main className="mx-auto max-w-6xl flex-1 px-4 py-12">
        <p className="text-sm text-zinc-500">Invalid order.</p>
      </main>
    );
  }

  if (!authReady) {
    return (
      <main className="mx-auto max-w-6xl flex-1 px-4 py-12">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="relative mx-auto max-w-6xl flex-1 px-4 py-12">
      {paySuccessToast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-emerald-800/80 bg-emerald-950/95 px-5 py-3 text-sm font-medium text-emerald-100 shadow-lg shadow-black/40"
          role="status"
        >
          Payment successful!
        </div>
      )}

      <nav className="mb-8 text-sm text-zinc-500">
        <Link href="/orders" className="hover:text-zinc-300">
          Orders
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <span className="text-zinc-400">#{orderId}</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
        Order #{orderId}
      </h1>

      {loading && <p className="mt-8 text-sm text-zinc-500">Loading…</p>}
      {error && !loading && (
        <p className="mt-8 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      {order && !loading && (
        <div className="mt-10 space-y-8">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-zinc-400">
            <span>{order.status}</span>
            <span className="text-zinc-700">·</span>
            <span>{order.is_cod ? "Cash on delivery" : "Card"}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-300">
              {order.payment_status === "paid" ? "Paid" : "Unpaid"}
            </span>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950">
            <h2 className="border-b border-zinc-800 px-5 py-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Items
            </h2>
            <ul className="divide-y divide-zinc-800">
              {order.items.map((it) => {
                const label =
                  it.product_name?.trim() || `Product #${it.product_id}`;
                return (
                  <li key={it.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium text-zinc-50">{label}</p>
                      <p className="text-sm tabular-nums text-zinc-300">
                        {formatMoney(lineTotal(it))}
                      </p>
                    </div>
                    {it.variant_name ? (
                      <p className="mt-1 text-xs text-zinc-500">{it.variant_name}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-zinc-500">
                      Qty {it.quantity} × {formatMoney(it.unit_price)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="text-lg font-medium tabular-nums text-zinc-100">
            Total: {formatMoney(order.total_price)}
          </p>

          <p>
            <Link
              href={`/orders/${order.id}/receipt`}
              className="text-sm font-medium text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
            >
              View receipt
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl flex-1 px-4 py-12">
          <p className="text-sm text-zinc-500">Loading…</p>
        </main>
      }
    >
      <OrderDetailContent />
    </Suspense>
  );
}
