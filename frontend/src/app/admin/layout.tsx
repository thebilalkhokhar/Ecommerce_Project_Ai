"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MessageSquare,
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
    { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  ];

function navItemClass(active: boolean, expanded: boolean) {
  return `flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors ${
    expanded ? "gap-3 px-3" : "justify-center px-0"
  } ${
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
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("admin-sidebar-expanded");
    if (saved === "0") setSidebarExpanded(false);
    if (saved === "1") setSidebarExpanded(true);
  }, []);

  function toggleSidebar() {
    setSidebarExpanded((e) => {
      const next = !e;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("admin-sidebar-expanded", next ? "1" : "0");
      }
      return next;
    });
  }

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

  const asideW = sidebarExpanded ? "w-64" : "w-[4.5rem]";
  /** left-4 (1rem) + sidebar width + margin to content — extra gap so content is not flush */
  const contentPad = sidebarExpanded
    ? "pl-[calc(1rem+16rem+1.75rem)]"
    : "pl-[calc(1rem+4.5rem+1.75rem)]";

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={`fixed left-4 top-4 z-40 flex h-[calc(100vh-2rem)] ${asideW} flex-col overflow-hidden rounded-3xl border border-textMain/10 bg-surface shadow-lg transition-[width] duration-200 ease-out`}
        aria-label="Admin navigation"
      >
        <div
          className={`flex shrink-0 items-center gap-2 border-b border-textMain/8 py-4 ${
            sidebarExpanded ? "justify-between px-4" : "flex-col px-2"
          }`}
        >
          {sidebarExpanded ? (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-textMain/50">
                ShopOne
              </p>
              <p className="mt-1 truncate text-base font-semibold text-textMain">
                Admin Console
              </p>
            </div>
          ) : (
            <p className="sr-only">ShopOne Admin</p>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-textMain/10 bg-background text-textMain/70 transition-colors hover:border-primary/25 hover:bg-primary/5 hover:text-textMain"
            aria-expanded={sidebarExpanded}
            aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarExpanded ? (
              <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
            ) : (
              <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            )}
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2 sm:p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathIsActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                title={sidebarExpanded ? undefined : label}
                className={navItemClass(active, sidebarExpanded)}
              >
                <Icon
                  className="h-4 w-4 shrink-0 opacity-90"
                  strokeWidth={1.75}
                  aria-hidden
                />
                {sidebarExpanded ? (
                  label
                ) : (
                  <span className="sr-only">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-textMain/8 p-2 sm:p-3">
          <button
            type="button"
            onClick={() => void handleLogout()}
            title={sidebarExpanded ? undefined : "Logout"}
            className={`flex w-full items-center rounded-xl py-2.5 text-left text-sm font-medium text-textMain/75 transition-colors hover:bg-red-50 hover:text-red-700 ${
              sidebarExpanded ? "gap-3 px-3" : "justify-center px-0"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {sidebarExpanded ? "Logout" : <span className="sr-only">Logout</span>}
          </button>
        </div>
      </aside>

      <div
        className={`min-h-screen pb-6 pr-5 pt-4 transition-[padding-left] duration-200 ease-out md:pr-10 md:pt-6 lg:pr-12 ${contentPad}`}
      >
        <main className="min-w-0 max-w-[1600px]">{children}</main>
      </div>
    </div>
  );
}
