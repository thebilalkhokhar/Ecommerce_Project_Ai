"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import api, { TOKEN_KEY } from "@/lib/axios";
import { useAuthStore, type AuthUser } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

const NAV: readonly { href: string; label: string; icon: typeof LayoutDashboard }[] =
  [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
  ];

function navItemClass(active: boolean) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "bg-primary/10 text-primary"
      : "text-textMain/75 hover:bg-textMain/5 hover:text-textMain"
  }`;
}

function pathIsActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") {
    return pathname === href || pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
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
  const logout = useAuthStore((s) => s.logout);

  const [checked, setChecked] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function gate() {
      initAuth();
      const token =
        typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      if (!token) {
        if (!cancelled) {
          toast.error("Unauthorized access");
          router.replace("/");
          setChecked(true);
        }
        return;
      }

      let current: AuthUser | null = user;
      if (!current) {
        try {
          const { data } = await api.get<AuthUser>("/users/me");
          if (cancelled) return;
          setUser(data);
          current = data;
        } catch {
          if (!cancelled) {
            toast.error("Unauthorized access");
            router.replace("/");
            setChecked(true);
          }
          return;
        }
      }

      if (cancelled) return;
      if (!current?.is_admin) {
        toast.error("Unauthorized access");
        router.replace("/");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gate once on mount
  }, []);

  useEffect(() => {
    if (!ok || !pathname.startsWith("/admin")) return;
    const u = useAuthStore.getState().user;
    if (u && !u.is_admin) {
      toast.error("Unauthorized access");
      router.replace("/");
    }
  }, [pathname, ok, router]);

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      /* continue */
    }
    logout();
    useCartStore.getState().clearCart();
    useCartStore.persist.clearStorage();
    toast.success("Logged out successfully");
    router.push("/");
    router.refresh();
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-3 bg-background">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
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
    <div className="min-h-screen bg-background">
      <aside
        className="fixed left-4 top-4 z-40 flex h-[calc(100vh-2rem)] w-64 flex-col overflow-hidden rounded-3xl border border-textMain/10 bg-surface shadow-lg"
        aria-label="Admin navigation"
      >
        <div className="border-b border-textMain/8 px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-textMain/50">
            ShopOne
          </p>
          <p className="mt-1 text-base font-semibold text-textMain">
            Admin Console
          </p>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathIsActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={navItemClass(active)}
              >
                <Icon
                  className="h-4 w-4 shrink-0 opacity-90"
                  strokeWidth={1.75}
                  aria-hidden
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-textMain/8 p-3">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-textMain/75 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
            Logout
          </button>
        </div>
      </aside>

      <div className="min-h-screen pl-68 pr-4 pb-6 pt-4 md:pl-70 md:pr-6 md:pt-6">
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
