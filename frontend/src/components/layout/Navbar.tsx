"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore, selectItemUnitCount } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

export function Navbar() {
  const itemCount = useCartStore(selectItemUnitCount);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    useAuthStore.getState().initAuth();
  }, []);

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
