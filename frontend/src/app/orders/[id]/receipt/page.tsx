"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

type OrderItemReceipt = {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  variant_name?: string | null;
  product_name?: string | null;
};

type OrderReceiptData = {
  id: number;
  user_id: number;
  total_price: string | number;
  status: string;
  is_cod: boolean;
  created_at?: string | null;
  user?: {
    id: number;
    email: string;
    full_name: string | null;
  } | null;
  items: OrderItemReceipt[];
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

function formatInvoiceDate(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function OrderReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params.id;
  const orderId =
    typeof idParam === "string" ? idParam : Array.isArray(idParam) ? idParam[0] : "";

  const [order, setOrder] = useState<OrderReceiptData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    useAuthStore.getState().initAuth();
    if (!useAuthStore.getState().isAuthenticated) {
      router.replace(`/login?next=/orders/${orderId}/receipt`);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get<OrderReceiptData>(`/orders/${orderId}`);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.replace(`/login?next=/orders/${orderId}/receipt`);
          return;
        }
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setError("You do not have access to this invoice.");
          setOrder(null);
          return;
        }
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError("Order not found.");
          setOrder(null);
          return;
        }
        setError("Could not load invoice.");
        setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  const subtotal = order
    ? order.items.reduce(
        (sum, it) =>
          sum +
          (typeof it.unit_price === "number"
            ? it.unit_price
            : Number.parseFloat(String(it.unit_price))) *
            it.quantity,
        0,
      )
    : 0;

  return (
    <div className="min-h-screen bg-white p-6 text-black md:p-8 print:p-8">
      <div className="mx-auto max-w-3xl print:max-w-none">
        <button
          type="button"
          onClick={() => window.print()}
          className="print:hidden mb-8 inline-flex items-center gap-2 rounded-md border border-gray-400 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-200"
        >
          🖨️ Print / Download PDF
        </button>

        {loading && (
          <p className="text-sm text-gray-600 print:hidden">Loading invoice…</p>
        )}

        {error && !loading && (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 print:hidden">
            <p>{error}</p>
            <Link
              href="/orders"
              className="mt-3 inline-block font-medium text-red-900 underline"
            >
              Back to orders
            </Link>
          </div>
        )}

        {order && !loading && !error && (
          <>
            <header className="border-b border-gray-300 pb-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-black md:text-3xl">
                    ShopOne
                  </h1>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
                    Invoice
                  </p>
                </div>
                <div className="text-right text-sm text-gray-800">
                  <p className="font-semibold text-black">Order #{order.id}</p>
                  <p className="mt-1">{formatInvoiceDate(order.created_at)}</p>
                </div>
              </div>
            </header>

            <section className="mt-8 grid gap-8 border-b border-gray-300 pb-8 sm:grid-cols-2">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">
                  Billed to
                </h2>
                <p className="mt-2 font-medium text-black">
                  {order.user?.full_name?.trim() ||
                    order.user?.email ||
                    `Customer #${order.user_id}`}
                </p>
                {order.user?.email ? (
                  <p className="mt-1 text-sm text-gray-700">{order.user.email}</p>
                ) : null}
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">
                  Payment method
                </h2>
                <p className="mt-2 font-medium text-black">
                  {order.is_cod ? "Cash on Delivery" : "—"}
                </p>
              </div>
            </section>

            <section className="mt-8">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="pb-3 pr-4 font-semibold text-black">Item</th>
                    <th className="pb-3 pr-4 text-right font-semibold text-black">
                      Qty
                    </th>
                    <th className="pb-3 pr-4 text-right font-semibold text-black">
                      Price
                    </th>
                    <th className="pb-3 text-right font-semibold text-black">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => {
                    const unit =
                      typeof it.unit_price === "number"
                        ? it.unit_price
                        : Number.parseFloat(String(it.unit_price));
                    const line = (Number.isFinite(unit) ? unit : 0) * it.quantity;
                    const label =
                      it.product_name?.trim() || `Product #${it.product_id}`;
                    return (
                      <tr key={it.id} className="border-b border-gray-300">
                        <td className="py-3 pr-4 align-top text-black">
                          <span className="font-medium">{label}</span>
                          {it.variant_name ? (
                            <span className="mt-1 block text-xs text-gray-600">
                              {it.variant_name}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums text-gray-800">
                          {it.quantity}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums text-gray-800">
                          {formatMoney(it.unit_price)}
                        </td>
                        <td className="py-3 text-right tabular-nums font-medium text-black">
                          {formatMoney(line)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <footer className="mt-8 border-t border-gray-300 pt-6">
              <div className="ml-auto max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-gray-800">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-800">
                  <span>Delivery</span>
                  <span className="tabular-nums">
                    {formatMoney(0)} (Free)
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2 text-base font-bold text-black">
                  <span>Grand total</span>
                  <span className="tabular-nums">
                    {formatMoney(order.total_price)}
                  </span>
                </div>
              </div>
              <p className="mt-12 text-center text-sm text-gray-600">
                Thank you for your business!
              </p>
            </footer>

            <p className="mt-10 print:hidden">
              <Link
                href="/orders"
                className="text-sm font-medium text-gray-700 underline"
              >
                ← Back to orders
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
