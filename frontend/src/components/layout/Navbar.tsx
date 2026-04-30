"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useCartStore, selectItemUnitCount } from "@/store/cartStore";
import { useAuthStore, type AuthUser } from "@/store/authStore";
import api from "@/lib/axios";

export function Navbar() {
  const itemCount = useCartStore(selectItemUnitCount);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    useAuthStore.getState().initAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<AuthUser>("/users/me");
        if (!cancelled) {
          setUser(data);
        }
      } catch {
        /* token invalid or network — leave user null */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, setUser]);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-50"
        >
          ShopOne
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/products"
            className="text-sm font-medium text-zinc-400 transition hover:text-zinc-50"
          >
            Products
          </Link>

          {isAuthenticated && (
            <Link
              href="/orders"
              className="text-sm font-medium text-zinc-400 transition hover:text-zinc-50"
            >
              Orders
            </Link>
          )}

          {isAuthenticated && (
            <Link
              href="/profile"
              className="text-sm font-medium text-zinc-400 transition hover:text-zinc-50"
            >
              Profile
            </Link>
          )}

          {isAuthenticated && user?.is_admin && (
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-zinc-300 transition hover:text-zinc-50"
            >
              Admin Panel
            </Link>
          )}

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => logout()}
              className="text-sm font-medium text-zinc-400 transition hover:text-zinc-50"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-400 transition hover:text-zinc-50"
            >
              Login
            </Link>
          )}

          {isAuthenticated && (
            <Link
              href="/wishlist"
              className="flex items-center gap-1 text-sm font-medium text-zinc-400 transition hover:text-zinc-50"
              aria-label="Wishlist"
            >
              <Heart className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Wishlist</span>
            </Link>
          )}

          <Link
            href="/cart"
            className="relative flex items-center gap-1.5 rounded-md p-2 text-zinc-300 transition hover:bg-zinc-900"
            aria-label={`Cart, ${itemCount} items`}
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-50 px-1 text-[10px] font-medium text-zinc-950">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
