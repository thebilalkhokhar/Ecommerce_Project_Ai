"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import api from "@/lib/axios";

const STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof STATUSES)[number];

type AdminOrder = {
  id: number;
  user_id: number;
  total_price: string | number;
  status: OrderStatus;
  is_cod: boolean;
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
    <div>
      <header className="mb-8 border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Orders
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Review and update order statuses.
        </p>
      </header>

      {isLoading ? (
        <p className="text-sm text-zinc-500" aria-live="polite">
          Loading orders…
        </p>
      ) : orders.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900/30 py-12 text-center text-sm text-zinc-500">
          No orders yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Order ID
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Customer
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Total
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orders.map((order) => (
                <tr key={order.id} className="bg-zinc-950/80 hover:bg-zinc-900/30">
                  <td className="px-4 py-3 tabular-nums text-zinc-300">
                    #{order.id}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    <span title="Order date not stored in API">—</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    User #{order.user_id}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-200">
                    {formatMoney(order.total_price)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      disabled={patchingId === order.id}
                      onChange={(e) =>
                        handleStatusChange(
                          order.id,
                          e.target.value as OrderStatus,
                        )
                      }
                      className="w-full max-w-[140px] rounded-md border border-zinc-800 bg-zinc-900 py-1.5 pl-2 pr-8 text-xs font-medium text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
                      aria-label={`Status for order ${order.id}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
