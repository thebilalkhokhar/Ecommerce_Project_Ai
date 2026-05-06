"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import axios from "axios";
import { Loader2, Printer } from "lucide-react";
import api from "@/lib/axios";

const STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof STATUSES)[number];

type OrderUser = {
  id: number;
  email: string;
  full_name: string | null;
};

type AdminOrder = {
  id: number;
  user_id: number;
  total_price: string | number;
  status: OrderStatus;
  is_cod: boolean;
  created_at?: string | null;
  user?: OrderUser | null;
};

function formatMoney(amount: string | number): string {
  const n =
    typeof amount === "number" ? amount : Number.parseFloat(String(amount));
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

function formatOrderDate(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function customerLabel(order: AdminOrder): string {
  const u = order.user;
  if (u?.full_name?.trim()) return u.full_name.trim();
  if (u?.email) return u.email;
  return `User #${order.user_id}`;
}

const selectClass =
  "w-full max-w-[160px] rounded-xl border border-primary/15 bg-background py-2 pl-2.5 pr-8 text-xs font-semibold text-textMain shadow-sm transition focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patchingId, setPatchingId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<AdminOrder[]>("/orders/all");
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Could not load orders.");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function handleStatusChange(orderId: number, newStatus: OrderStatus) {
    setPatchingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      toast.success("Order status updated.");
    } catch (err) {
      let msg = "Could not update status.";
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string") {
          msg = detail;
        }
      }
      toast.error(msg);
      await loadOrders();
    } finally {
      setPatchingId(null);
    }
  }

  return (
    <div className="space-y-8 pb-4">
      <header className="rounded-2xl border border-primary/10 bg-surface px-5 py-6 shadow-sm md:px-7 md:py-8">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Fulfillment
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-textMain md:text-3xl">
          Orders
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-textMain/70">
          Review every order, update status for your workflow, and open printable
          invoices in a new tab.
        </p>
      </header>

      {!isLoading ? (
        <p className="text-xs font-medium text-textMain/50">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </p>
      ) : null}

      {isLoading ? (
        <div
          className="flex items-center gap-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-6 py-12"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2
            className="h-6 w-6 shrink-0 animate-spin text-primary"
            strokeWidth={2}
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium text-textMain">Loading orders…</p>
            <p className="mt-0.5 text-xs text-textMain/55">
              Fetching from the server
            </p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-14 text-center text-sm font-medium text-textMain/70">
          No orders yet. They’ll appear here once customers check out.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-primary/5">
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                    Order ID
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                    Date
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                    Customer
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                    Total
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 bg-surface">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-primary/4"
                  >
                    <td className="px-4 py-3.5 tabular-nums font-medium text-textMain">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3.5 text-textMain/70">
                      {formatOrderDate(order.created_at)}
                    </td>
                    <td
                      className="max-w-[220px] truncate px-4 py-3.5 text-textMain/80"
                      title={customerLabel(order)}
                    >
                      {customerLabel(order)}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums font-semibold text-textMain">
                      {formatMoney(order.total_price)}
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={order.status}
                        disabled={patchingId === order.id}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as OrderStatus,
                          )
                        }
                        className={selectClass}
                        aria-label={`Status for order ${order.id}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {order.is_cod ? (
                        <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-textMain/45">
                          COD
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/invoice/${order.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-textMain/70 transition hover:border-primary/35 hover:bg-primary/10 hover:text-textMain active:scale-95"
                        aria-label={`Open invoice for order ${order.id}`}
                      >
                        <Printer className="h-4 w-4" strokeWidth={1.75} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
