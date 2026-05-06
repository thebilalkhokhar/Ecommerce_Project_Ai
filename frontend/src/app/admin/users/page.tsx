"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-textMain">
        Users
      </h1>
      <p className="text-sm text-textMain/65">
        Customer accounts (non-admin). Source:{" "}
        <code className="text-xs">GET /users/all</code>
      </p>

      {loading ? (
        <p className="text-sm text-textMain/60">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-textMain/10 bg-surface p-8 text-sm text-textMain/60 shadow-sm">
          No customer users found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-textMain/10 bg-surface shadow-sm">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead>
              <tr className="border-b border-textMain/10 text-xs font-medium uppercase tracking-wide text-textMain/55">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">City</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-textMain/8 last:border-0 hover:bg-primary/[0.04]"
                >
                  <td className="px-4 py-3 tabular-nums text-textMain/80">
                    {u.id}
                  </td>
                  <td className="px-4 py-3 font-medium text-textMain">
                    {u.full_name}
                  </td>
                  <td className="px-4 py-3 text-textMain/85">{u.email}</td>
                  <td className="px-4 py-3 text-textMain/75">{u.phone_number}</td>
                  <td className="px-4 py-3 text-textMain/75">{u.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
