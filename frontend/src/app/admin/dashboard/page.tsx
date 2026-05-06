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

const COLOR_PRIMARY = "#FF724C";
const COLOR_SECONDARY = "#FDBF50";
const COLOR_TEXT_MAIN = "#2A2C41";

const PIE_COLORS = [
  COLOR_PRIMARY,
  COLOR_SECONDARY,
  "#FF9B7A",
  "#FDCA66",
  "#E85D3A",
  "#FCE588",
];

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

const tooltipStyles = {
  backgroundColor: "#FFFFFF",
  border: "1px solid rgba(255, 114, 76, 0.2)",
  borderRadius: "12px",
  boxShadow: "0 8px 24px rgba(42, 44, 65, 0.08)",
};

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
    <div className="space-y-8 pb-4">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Analytics
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-textMain md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm text-textMain/70">
            Revenue, orders, and catalog metrics for the range you select.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-primary/10 bg-surface p-4 shadow-sm sm:w-auto sm:flex-row sm:items-end sm:gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-initial">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-textMain/50">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full min-w-[11rem] rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-sm text-textMain shadow-sm focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10"
              aria-label="Start date"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-initial">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-textMain/50">
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full min-w-[11rem] rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-sm text-textMain shadow-sm focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10"
              aria-label="End date"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadAnalytics(startDate, endDate)}
            className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.98]"
          >
            Apply range
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-6 py-16 text-center">
          <div
            className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
          <p className="mt-4 text-sm font-medium text-textMain/70">
            Loading analytics…
          </p>
        </div>
      ) : null}

      {!isLoading && !analyticsData ? (
        <div className="rounded-2xl border border-primary/15 bg-surface px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-medium text-textMain">
            No analytics loaded
          </p>
          <p className="mt-2 text-sm text-textMain/60">
            Check your connection and try again with &quot;Apply range&quot;.
          </p>
        </div>
      ) : null}

      {!isLoading && analyticsData ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex gap-4 rounded-2xl border border-primary/10 bg-surface p-5 shadow-sm transition-shadow hover:border-primary/15 hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <CircleDollarSign className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-textMain/50">
                  Revenue
                </p>
                <p className="mt-1 truncate text-lg font-bold tabular-nums text-textMain">
                  {formatPKR(analyticsData.total_revenue)}
                </p>
                <p className="mt-0.5 text-xs text-textMain/55">In selected range</p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-primary/10 bg-surface p-5 shadow-sm transition-shadow hover:border-primary/15 hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-secondary/25 bg-secondary/15 text-textMain">
                <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-textMain/50">
                  Orders
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-textMain">
                  {analyticsData.total_orders}
                </p>
                <p className="mt-0.5 text-xs text-textMain/55">In selected range</p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-primary/10 bg-surface p-5 shadow-sm transition-shadow hover:border-primary/15 hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Users className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-textMain/50">
                  Customers
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-textMain">
                  {analyticsData.total_customers}
                </p>
                <p className="mt-0.5 text-xs text-textMain/55">All users</p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-primary/10 bg-surface p-5 shadow-sm transition-shadow hover:border-primary/15 hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-secondary/25 bg-secondary/15 text-textMain">
                <Package className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-textMain/50">
                  Products
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-textMain">
                  {analyticsData.total_products}
                </p>
                <p className="mt-0.5 text-xs text-textMain/55">In catalog</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-primary/10 bg-surface p-5 shadow-sm md:p-6">
              <h2 className="mb-1 text-sm font-semibold text-textMain">
                Revenue trend
              </h2>
              <p className="mb-4 text-xs text-textMain/55">Daily totals for the range above</p>
              {trendChartData.length === 0 ? (
                <p className="rounded-xl border border-dashed border-primary/20 bg-primary/5 py-12 text-center text-sm text-textMain/65">
                  No revenue in this period.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={trendChartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={COLOR_PRIMARY}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor={COLOR_PRIMARY}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="rgba(42, 44, 65, 0.12)"
                      strokeDasharray="4 4"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: COLOR_TEXT_MAIN, fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(42, 44, 65, 0.2)" }}
                    />
                    <YAxis
                      tick={{ fill: COLOR_TEXT_MAIN, fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(42, 44, 65, 0.2)" }}
                      tickFormatter={(v) =>
                        new Intl.NumberFormat("en-PK", {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        }).format(Number(v))
                      }
                    />
                    <Tooltip
                      contentStyle={tooltipStyles}
                      labelStyle={{ color: COLOR_TEXT_MAIN, fontWeight: 600 }}
                      itemStyle={{ color: COLOR_TEXT_MAIN }}
                      formatter={(value) => formatPKR(Number(value ?? 0))}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={COLOR_PRIMARY}
                      strokeWidth={2}
                      fill="url(#adminRevGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-2xl border border-primary/10 bg-surface p-5 shadow-sm md:p-6">
              <h2 className="mb-1 text-sm font-semibold text-textMain">
                Order status
              </h2>
              <p className="mb-4 text-xs text-textMain/55">
                Share of orders by status in this range
              </p>
              {pieData.length === 0 ? (
                <p className="rounded-xl border border-dashed border-primary/20 bg-primary/5 py-12 text-center text-sm text-textMain/65">
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
                      stroke="rgba(42, 44, 65, 0.12)"
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
                      contentStyle={tooltipStyles}
                      labelStyle={{ color: COLOR_TEXT_MAIN, fontWeight: 600 }}
                      itemStyle={{ color: COLOR_TEXT_MAIN }}
                    />
                    <Legend
                      wrapperStyle={{
                        color: COLOR_TEXT_MAIN,
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
