"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import api, { TOKEN_KEY } from "@/lib/axios";
import { useAuthStore, type AuthUser } from "@/store/authStore";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
] as const;

function navLinkClass(active: boolean) {
  return `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? "bg-gray-200 text-textMain"
      : "text-textMain/70 hover:bg-gray-50 hover:text-textMain"
  }`;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const initAuth = useAuthStore((s) => s.initAuth);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [checked, setChecked] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function gate() {
      initAuth();
      const token =
        typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      if (!token) {
        toast.error("Unauthorized access");
        router.push("/");
        setChecked(true);
        return;
      }

      let current: AuthUser | null = user;
      if (!current) {
        try {
          const { data } = await api.get<AuthUser>("/users/me");
          if (cancelled) return;
          setUser(data);
          current = data;
        } catch (err) {
          if (cancelled) return;
          toast.error("Unauthorized access");
          router.push("/");
          setChecked(true);
          return;
        }
      }

      if (cancelled) return;
      if (!current?.is_admin) {
        toast.error("Unauthorized access");
        router.push("/");
        setChecked(true);
        return;
      }

      setOk(true);
      setChecked(true);
    }

    void gate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gate once on mount; user may hydrate async
  }, []);

  if (!checked) {
    return (
      <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 bg-background">
        <Loader2
          className="h-8 w-8 animate-spin text-textMain/60"
          strokeWidth={1.5}
          aria-hidden
        />
        <p className="text-sm text-textMain/60">Checking access…</p>
      </div>
    );
  }

  if (!ok) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background md:flex-row">
      <aside className="hidden shrink-0 border-r border-gray-200 bg-gray-50 md:flex md:w-56 md:flex-col">
        <div className="border-b border-gray-200 px-4 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-textMain/60">
            Admin
          </p>
          <p className="mt-1 text-sm font-semibold text-textMain">Dashboard</p>
        </div>
        <nav className="flex flex-col gap-0.5 p-3" aria-label="Admin sections">
          {ADMIN_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={navLinkClass(pathname === href)}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <nav
        className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 px-3 py-2 md:hidden"
        aria-label="Admin sections"
      >
        {ADMIN_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              pathname === href
                ? "border-gray-300 bg-gray-200 text-textMain"
                : "border-gray-200 text-textMain/70"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <main className="min-w-0 flex-1 bg-background p-4 md:p-8">{children}</main>
    </div>
  );
}
