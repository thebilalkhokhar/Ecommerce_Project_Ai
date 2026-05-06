"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/axios";
import { useAuthStore, type AuthUser } from "@/store/authStore";

const STORE = {
  name: "ShopOne",
  tagline: "Quality products, delivered with care",
  addressLines: ["123 Commerce Street", "Karachi, Sindh 75500", "Pakistan"],
  email: "hello@shopone.example",
  phone: "+92 300 0000000",
} as const;

type OrderItemRow = {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  variant_name?: string | null;
  product_name?: string | null;
};

type OrderUserRow = {
  id: number;
  email: string;
  full_name: string | null;
  phone_number?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
};

type OrderInvoiceData = {
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

function normalizeStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "delivered") {
    return "bg-emerald-100 text-emerald-900 ring-emerald-200 print:border print:border-gray-400 print:bg-white print:text-black";
  }
  if (s === "cancelled") {
    return "bg-red-100 text-red-900 ring-red-200 print:border print:border-gray-400 print:bg-white print:text-black";
  }
  return "bg-gray-100 text-gray-900 ring-gray-200 print:border print:border-gray-400 print:bg-white print:text-black";
}

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const ordersListHref = user?.is_admin ? "/admin/orders" : "/orders";
  const idParam = params.id;
  const orderId =
    typeof idParam === "string" ? idParam : Array.isArray(idParam) ? idParam[0] : "";

  const [order, setOrder] = useState<OrderInvoiceData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    useAuthStore.getState().initAuth();
    if (!orderId) return;
    if (!useAuthStore.getState().isAuthenticated) {
      router.replace(`/login?next=/invoice/${orderId}`);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get<OrderInvoiceData>(`/orders/${orderId}`);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.replace(`/login?next=/invoice/${orderId}`);
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

  useEffect(() => {
    if (!isAuthenticated || user != null) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<AuthUser>("/users/me");
        if (!cancelled) setUser(data);
      } catch {
        /* leave user null */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, setUser]);

  const subtotal = order
    ? order.items.reduce((sum, it) => {
        const unit =
          typeof it.unit_price === "number"
            ? it.unit_price
            : Number.parseFloat(String(it.unit_price));
        const u = Number.isFinite(unit) ? unit : 0;
        return sum + u * it.quantity;
      }, 0)
    : 0;

  const totalNum =
    order != null
      ? typeof order.total_price === "number"
        ? order.total_price
        : Number.parseFloat(String(order.total_price))
      : 0;

  return (
    <div className="min-h-screen bg-white text-gray-900 print:bg-white print:text-black">
      <div className="mx-auto my-10 max-w-4xl p-10 print:m-0 print:max-w-none print:p-0">
        <button
          type="button"
          onClick={() => window.print()}
          className="print:hidden mb-8 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
        >
          Print Invoice
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-lg print:rounded-none print:border-0 print:p-0 print:shadow-none">
          {loading && (
            <p className="text-sm text-gray-600 print:hidden">Loading invoice…</p>
          )}

          {error && !loading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 print:hidden">
              <p>{error}</p>
              <Link
                href={ordersListHref}
                className="mt-3 inline-block font-medium text-red-900 underline"
              >
                Back to orders
              </Link>
            </div>
          )}

          {order && !loading && !error && (
            <>
              <header className="flex flex-col gap-8 border-b border-gray-300 pb-8 print:border-black md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold tracking-tight text-gray-900 print:text-black">
                      {STORE.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 print:text-gray-800">
                      {STORE.tagline}
                    </p>
                  </div>
                  <address className="not-italic text-sm leading-relaxed text-gray-700 print:text-gray-900">
                    {STORE.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                    <span className="mt-2 block">{STORE.email}</span>
                    <span className="block">{STORE.phone}</span>
                  </address>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-3xl font-extrabold tracking-tight text-gray-900 print:text-black md:text-4xl">
                    INVOICE
                  </p>
                  <p className="mt-3 text-sm font-semibold text-gray-900 print:text-black">
                    Invoice #<span className="tabular-nums">{order.id}</span>
                  </p>
                  <p className="mt-1 text-sm text-gray-700 print:text-gray-900">
                    {formatInvoiceDate(order.created_at)}
                  </p>
                  <span
                    className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${statusBadgeClass(order.status)}`}
                  >
                    {normalizeStatus(order.status)}
                  </span>
                </div>
              </header>

              <section className="mt-8 grid gap-10 border-b border-gray-300 pb-8 print:border-black md:grid-cols-2">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 print:text-gray-700">
                    Bill to
                  </h2>
                  <div className="mt-3 space-y-1 text-sm text-gray-900 print:text-black">
                    <p className="text-base font-semibold">
                      {order.user?.full_name?.trim() ||
                        order.user?.email ||
                        `Customer #${order.user_id}`}
                    </p>
                    {order.user?.email ? (
                      <p className="text-gray-700 print:text-gray-900">
                        {order.user.email}
                      </p>
                    ) : null}
                    {order.user?.phone_number ? (
                      <p className="text-gray-700 print:text-gray-900">
                        {order.user.phone_number}
                      </p>
                    ) : null}
                    {(order.user?.address_line_1 || order.user?.city) && (
                      <p className="mt-2 leading-relaxed text-gray-700 print:text-gray-900">
                        {order.user.address_line_1}
                        {order.user.address_line_2 ? (
                          <>
                            <br />
                            {order.user.address_line_2}
                          </>
                        ) : null}
                        <br />
                        {[
                          order.user.city,
                          order.user.state,
                          order.user.postal_code,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 print:text-gray-700">
                    Order details
                  </h2>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div>
                      <dt className="font-medium text-gray-500 print:text-gray-700">
                        Payment method
                      </dt>
                      <dd className="mt-0.5 font-semibold text-gray-900 print:text-black">
                        {order.is_cod ? "Cash on delivery" : "Online payment"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500 print:text-gray-700">
                        Payment status
                      </dt>
                      <dd className="mt-0.5 font-semibold capitalize text-gray-900 print:text-black">
                        {order.payment_status === "paid"
                          ? "Paid"
                          : "Unpaid"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500 print:text-gray-700">
                        Order status
                      </dt>
                      <dd className="mt-0.5 font-semibold text-gray-900 print:text-black">
                        {normalizeStatus(order.status)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>

              <section className="mt-8">
                <table className="w-full border-collapse text-left text-sm text-gray-900 print:text-black">
                  <thead>
                    <tr className="border-b-2 border-gray-900 print:border-black">
                      <th className="py-3 pr-4 font-semibold text-gray-900 print:text-black">
                        Item description
                      </th>
                      <th className="py-3 pr-4 text-right font-semibold tabular-nums text-gray-900 print:text-black">
                        Qty
                      </th>
                      <th className="py-3 pr-4 text-right font-semibold tabular-nums text-gray-900 print:text-black">
                        Unit price
                      </th>
                      <th className="py-3 text-right font-semibold tabular-nums text-gray-900 print:text-black">
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
                        <tr
                          key={it.id}
                          className="border-b border-gray-200 print:border-gray-400"
                        >
                          <td className="py-3 pr-4 align-top">
                            <span className="font-medium">{label}</span>
                            {it.variant_name ? (
                              <span className="mt-1 block text-xs text-gray-600 print:text-gray-800">
                                {it.variant_name}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums text-gray-800 print:text-black">
                            {it.quantity}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums text-gray-800 print:text-black">
                            {formatMoney(it.unit_price)}
                          </td>
                          <td className="py-3 text-right tabular-nums font-medium text-gray-900 print:text-black">
                            {formatMoney(line)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>

              <section className="mt-10 flex justify-end border-t border-gray-300 pt-6 print:border-black">
                <div className="w-full max-w-xs space-y-2 text-sm text-gray-900 print:text-black">
                  <div className="flex justify-between text-gray-800 print:text-black">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-800 print:text-black">
                    <span>Shipping</span>
                    <span className="tabular-nums">
                      Included in total
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-3 text-lg font-bold text-gray-900 print:border-black print:text-black">
                    <span>Final total</span>
                    <span className="tabular-nums">
                      {formatMoney(
                        Number.isFinite(totalNum) ? totalNum : subtotal,
                      )}
                    </span>
                  </div>
                </div>
              </section>

              <p className="mt-12 text-center text-sm text-gray-600 print:text-black">
                Thank you for your business.
              </p>
            </>
          )}
        </div>

        <p className="mt-8 print:hidden">
          <Link
            href={ordersListHref}
            className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-gray-900"
          >
            ← Back to orders
          </Link>
        </p>
      </div>
    </div>
  );
}
