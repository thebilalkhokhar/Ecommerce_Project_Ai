"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";
import type { AuthUser } from "@/store/authStore";

export default function AdminUsersPage() {
  const [rows, setRows] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<AuthUser[]>("/users/all");
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) {
          toast.error("Could not load users.");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8 pb-4">
      <header className="rounded-2xl border border-primary/10 bg-surface px-5 py-6 shadow-sm md:px-7 md:py-8">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Customers
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-textMain md:text-3xl">
          Users
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-textMain/70">
          Accounts that can sign in and place orders. Data comes from{" "}
          <code className="rounded-md border border-primary/15 bg-primary/5 px-1.5 py-0.5 text-xs font-mono text-textMain/85">
            GET /users/all
          </code>
          .
        </p>
      </header>

      {!loading ? (
        <p className="text-xs font-medium text-textMain/50">
          {rows.length} {rows.length === 1 ? "user" : "users"}
        </p>
      ) : null}

      {loading ? (
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
            <p className="text-sm font-medium text-textMain">Loading users…</p>
            <p className="mt-0.5 text-xs text-textMain/55">
              Fetching customer directory
            </p>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-14 text-center text-sm font-medium text-textMain/70">
          No customer users found. New accounts appear after registration.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-primary/5">
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                    ID
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                    Name
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                    Email
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                    Phone
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                    City
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 bg-surface">
                {rows.map((u) => (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-primary/4"
                  >
                    <td className="px-4 py-3.5 tabular-nums text-textMain/75">
                      {u.id}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-textMain">
                      {u.full_name}
                    </td>
                    <td className="px-4 py-3.5 text-textMain/80">{u.email}</td>
                    <td className="px-4 py-3.5 text-textMain/70">
                      {u.phone_number}
                    </td>
                    <td className="px-4 py-3.5 text-textMain/70">{u.city}</td>
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
