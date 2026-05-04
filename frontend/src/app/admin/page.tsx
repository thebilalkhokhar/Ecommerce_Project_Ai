"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CircleDollarSign,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "@/lib/axios";

export type AnalyticsOut = {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  revenue_trend: Array<{ date: string; revenue: number }>;
  order_statuses: Array<{ status: string; count: number }>;
};

function toYMDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultEndDate(): string {
  return toYMDLocal(new Date());
}

function defaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return toYMDLocal(d);
}

function formatPKR(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

const PIE_COLORS = ["#a1a1aa", "#71717a", "#d4d4d8", "#52525b", "#e4e4e7"];

export default function AdminDashboardPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const loadAnalytics = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.get<AnalyticsOut>("/analytics", {
        params: { start_date: start, end_date: end },
      });
      setAnalyticsData(data);
    } catch {
      toast.error("Could not load analytics.");
      setAnalyticsData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics(startDate, endDate);
    // Initial load only; Filter button calls loadAnalytics with current inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trendChartData =
    analyticsData?.revenue_trend.map((r) => ({
      date: r.date,
      revenue: r.revenue,
    })) ?? [];

  const pieData =
    analyticsData?.order_statuses.map((s) => ({
      name: s.status,
      value: s.count,
    })) ?? [];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Dashboard
        </h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
            aria-label="Start date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
            aria-label="End date"
          />
          <button
            type="button"
            onClick={() => void loadAnalytics(startDate, endDate)}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700"
          >
            Filter
          </button>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-zinc-500">Loading analytics…</p>
      )}

      {!isLoading && analyticsData && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-zinc-300">
                <CircleDollarSign className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Revenue
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-50">
                  {formatPKR(analyticsData.total_revenue)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">In selected range</p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-zinc-300">
                <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Orders
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-50">
                  {analyticsData.total_orders}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">In selected range</p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-zinc-300">
                <Users className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Customers
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-50">
                  {analyticsData.total_customers}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">All users</p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-zinc-300">
                <Package className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Products
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-50">
                  {analyticsData.total_products}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">In catalog</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
              <h2 className="mb-4 text-sm font-medium text-zinc-300">
                Revenue trend
              </h2>
              {trendChartData.length === 0 ? (
                <p className="py-12 text-center text-sm text-zinc-500">
                  No revenue in this period.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={trendChartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#a1a1aa"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="#a1a1aa"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#27272a" strokeDasharray="4 4" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#a1a1aa", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#3f3f46" }}
                    />
                    <YAxis
                      tick={{ fill: "#a1a1aa", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#3f3f46" }}
                      tickFormatter={(v) =>
                        new Intl.NumberFormat("en-PK", {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        }).format(Number(v))
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "#fafafa" }}
                      itemStyle={{ color: "#e4e4e7" }}
                      formatter={(value) =>
                        formatPKR(Number(value ?? 0))
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#d4d4d8"
                      strokeWidth={2}
                      fill="url(#revGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
              <h2 className="mb-4 text-sm font-medium text-zinc-300">
                Order status
              </h2>
              {pieData.length === 0 ? (
                <p className="py-12 text-center text-sm text-zinc-500">
                  No orders in this period.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={96}
                      paddingAngle={2}
                      stroke="#27272a"
                      strokeWidth={1}
                    >
                      {pieData.map((_, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "6px",
                      }}
                      itemStyle={{ color: "#e4e4e7" }}
                    />
                    <Legend
                      wrapperStyle={{ color: "#a1a1aa", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
