"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useCartStore, selectItemUnitCount } from "@/store/cartStore";
import { useAuthStore, type AuthUser } from "@/store/authStore";
import api from "@/lib/axios";

export function Navbar() {
  const itemCount = useCartStore(selectItemUnitCount);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const closeMobile = () => setIsMobileMenuOpen(false);

  const linkDesktop =
    "inline-flex items-center gap-2 text-sm font-medium text-textMain/70 transition-colors hover:text-textMain";

  const linkMobile =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-textMain transition-colors hover:bg-gray-100";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-surface/95 backdrop-blur-sm print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-initial">
          <button
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            className="inline-flex rounded-md p-2 text-textMain/70 transition hover:bg-gray-100 hover:text-textMain md:hidden"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>
          <Link
            href="/"
            className="truncate text-lg font-semibold tracking-tight text-textMain"
            onClick={closeMobile}
          >
            ShopOne
          </Link>
        </div>

        <nav
          className="hidden items-center gap-5 md:flex md:flex-1 md:justify-center lg:gap-7"
          aria-label="Main"
        >
          <Link href="/products" className={linkDesktop}>
            <LayoutGrid className="h-4 w-4 opacity-80" strokeWidth={1.75} />
            Products
          </Link>
          {isAuthenticated && (
            <Link href="/orders" className={linkDesktop}>
              <Package className="h-4 w-4 opacity-80" strokeWidth={1.75} />
              Orders
            </Link>
          )}
          {isAuthenticated && (
            <Link href="/profile" className={linkDesktop}>
              <User className="h-4 w-4 opacity-80" strokeWidth={1.75} />
              Profile
            </Link>
          )}
          {isAuthenticated && user?.is_admin && (
            <Link href="/admin" className={linkDesktop}>
              <ShieldCheck className="h-4 w-4 opacity-80" strokeWidth={1.75} />
              Admin
            </Link>
          )}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => logout()}
              className={linkDesktop}
            >
              <LogOut className="h-4 w-4 opacity-80" strokeWidth={1.75} />
              Logout
            </button>
          ) : (
            <Link href="/login" className={linkDesktop}>
              <LogIn className="h-4 w-4 opacity-80" strokeWidth={1.75} />
              Login
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/wishlist"
            className="rounded-md p-2 text-textMain/70 transition hover:bg-gray-100 hover:text-textMain"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <Link
            href="/cart"
            className="relative flex items-center rounded-md p-2 text-textMain transition hover:bg-gray-100"
            aria-label={`Cart, ${itemCount} items`}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-medium text-textMain">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden border-b border-gray-200 bg-surface transition-all duration-300 ease-in-out print:hidden ${
          isMobileMenuOpen
            ? "max-h-[28rem] opacity-100"
            : "max-h-0 border-transparent opacity-0"
        }`}
        id="mobile-nav"
      >
        <nav
          className="mx-auto max-w-6xl space-y-0.5 px-4 py-4"
          aria-label="Mobile"
        >
          <Link href="/products" className={linkMobile} onClick={closeMobile}>
            <LayoutGrid
              className="h-4 w-4 text-textMain/60"
              strokeWidth={1.75}
            />
            Products
          </Link>
          {isAuthenticated && (
            <Link href="/orders" className={linkMobile} onClick={closeMobile}>
              <Package
                className="h-4 w-4 text-textMain/60"
                strokeWidth={1.75}
              />
              Orders
            </Link>
          )}
          {isAuthenticated && (
            <Link href="/profile" className={linkMobile} onClick={closeMobile}>
              <User className="h-4 w-4 text-textMain/60" strokeWidth={1.75} />
              Profile
            </Link>
          )}
          {isAuthenticated && user?.is_admin && (
            <Link href="/admin" className={linkMobile} onClick={closeMobile}>
              <ShieldCheck
                className="h-4 w-4 text-textMain/60"
                strokeWidth={1.75}
              />
              Admin
            </Link>
          )}
          {isAuthenticated ? (
            <button
              type="button"
              className={`${linkMobile} w-full text-left`}
              onClick={() => {
                logout();
                closeMobile();
              }}
            >
              <LogOut
                className="h-4 w-4 text-textMain/60"
                strokeWidth={1.75}
              />
              Logout
            </button>
          ) : (
            <Link href="/login" className={linkMobile} onClick={closeMobile}>
              <LogIn className="h-4 w-4 text-textMain/60" strokeWidth={1.75} />
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
