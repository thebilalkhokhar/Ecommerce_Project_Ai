"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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
import {
  useCartStore,
  selectItemUnitCount,
} from "@/store/cartStore";
import { useCartStoreHydrated } from "@/components/CartStoreProvider";
import { useAuthStore, type AuthUser } from "@/store/authStore";
import api from "@/lib/axios";

export function Navbar() {
  const router = useRouter();
  const itemCount = useCartStore(selectItemUnitCount);
  const cartHydrated = useCartStoreHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      /* Still sign out locally if token is invalid or the request fails. */
    }
    logout();
    useCartStore.getState().clearCart();
    useCartStore.persist.clearStorage();
    toast.success("Logged out successfully");
    router.push("/");
    router.refresh();
  }

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
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-textMain transition-colors hover:bg-textMain/6";

  const iconBtn =
    "inline-flex items-center justify-center rounded-full p-2 text-textMain/70 transition-colors hover:bg-textMain/6 hover:text-textMain";

  return (
    <>
      {/* Reserves space — navbar is fixed and out of document flow */}
      <div className="h-19 shrink-0 print:hidden md:h-20" aria-hidden />

      <header className="print:hidden">
        <div className="pointer-events-none fixed top-4 left-1/2 z-50 w-[95%] max-w-5xl -translate-x-1/2">
          <div className="pointer-events-auto flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 rounded-full border border-textMain/10 bg-surface px-5 py-2.5 shadow-lg backdrop-blur-md sm:gap-3 sm:px-6 sm:py-3 md:gap-4 md:px-8 md:py-3.5">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:flex-initial">
                <button
                  type="button"
                  aria-expanded={isMobileMenuOpen}
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  className={`${iconBtn} md:hidden`}
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
                  className="truncate text-base font-semibold tracking-tight text-textMain sm:text-lg"
                  onClick={closeMobile}
                >
                  ShopOne
                </Link>
              </div>

              <nav
                className="hidden min-w-0 items-center gap-4 md:flex md:flex-1 md:justify-center lg:gap-6"
                aria-label="Main"
              >
                <Link href="/products" className={linkDesktop}>
                  <LayoutGrid
                    className="h-4 w-4 opacity-80"
                    strokeWidth={1.75}
                  />
                  Products
                </Link>
                {isAuthenticated && (
                  <Link href="/orders" className={linkDesktop}>
                    <Package
                      className="h-4 w-4 opacity-80"
                      strokeWidth={1.75}
                    />
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
                    <ShieldCheck
                      className="h-4 w-4 opacity-80"
                      strokeWidth={1.75}
                    />
                    Admin
                  </Link>
                )}
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className={linkDesktop}
                  >
                    <LogOut
                      className="h-4 w-4 opacity-80"
                      strokeWidth={1.75}
                    />
                    Logout
                  </button>
                ) : (
                  <Link href="/login" className={linkDesktop}>
                    <LogIn className="h-4 w-4 opacity-80" strokeWidth={1.75} />
                    Login
                  </Link>
                )}
              </nav>

              <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                <Link
                  href="/wishlist"
                  className={iconBtn}
                  aria-label="Wishlist"
                >
                  <Heart className="h-5 w-5" strokeWidth={1.75} />
                </Link>
                <Link
                  href="/cart"
                  className={`${iconBtn} relative text-textMain`}
                  aria-label={`Cart, ${cartHydrated ? itemCount : 0} items`}
                >
                  <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
                  {cartHydrated && itemCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-medium text-textMain transition-opacity duration-150">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            <div
              className={`md:hidden overflow-hidden rounded-2xl border border-textMain/10 bg-surface shadow-md transition-all duration-300 ease-in-out ${
                isMobileMenuOpen
                  ? "max-h-112 opacity-100"
                  : "pointer-events-none max-h-0 border-transparent opacity-0 shadow-none"
              }`}
              id="mobile-nav"
            >
              <nav
                className="space-y-0.5 px-3 py-3 sm:px-4 sm:py-4"
                aria-label="Mobile"
              >
                <Link
                  href="/products"
                  className={linkMobile}
                  onClick={closeMobile}
                >
                  <LayoutGrid
                    className="h-4 w-4 text-textMain/60"
                    strokeWidth={1.75}
                  />
                  Products
                </Link>
                {isAuthenticated && (
                  <Link
                    href="/orders"
                    className={linkMobile}
                    onClick={closeMobile}
                  >
                    <Package
                      className="h-4 w-4 text-textMain/60"
                      strokeWidth={1.75}
                    />
                    Orders
                  </Link>
                )}
                {isAuthenticated && (
                  <Link
                    href="/profile"
                    className={linkMobile}
                    onClick={closeMobile}
                  >
                    <User
                      className="h-4 w-4 text-textMain/60"
                      strokeWidth={1.75}
                    />
                    Profile
                  </Link>
                )}
                {isAuthenticated && user?.is_admin && (
                  <Link
                    href="/admin"
                    className={linkMobile}
                    onClick={closeMobile}
                  >
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
                      void handleLogout();
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
                    <LogIn
                      className="h-4 w-4 text-textMain/60"
                      strokeWidth={1.75}
                    />
                    Login
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
