"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

type WishlistIdsContextValue = {
  /** Product ids in the signed-in user's wishlist (empty when logged out). */
  productIds: ReadonlySet<number>;
  /** True after the first wishlist load attempt for the current auth state finishes. */
  ready: boolean;
  /** Refetch wishlist (e.g. after toggle). */
  refresh: () => Promise<void>;
};

const WishlistIdsContext = createContext<WishlistIdsContextValue | null>(null);

export function WishlistIdsProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [productIds, setProductIds] = useState<Set<number>>(new Set());
  const [ready, setReady] = useState(false);

  const loadIds = useCallback(async () => {
    if (!useAuthStore.getState().isAuthenticated) {
      setProductIds(new Set());
      return;
    }
    try {
      const { data } = await api.get<Array<{ product: { id: number } }>>(
        "/wishlist",
      );
      const ids = new Set<number>();
      if (Array.isArray(data)) {
        for (const row of data) {
          if (row?.product?.id != null) ids.add(row.product.id);
        }
      }
      setProductIds(ids);
    } catch {
      setProductIds(new Set());
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadIds();
  }, [loadIds]);

  useEffect(() => {
    useAuthStore.getState().initAuth();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setReady(false);
      if (!useAuthStore.getState().isAuthenticated) {
        setProductIds(new Set());
        if (!cancelled) setReady(true);
        return;
      }
      await loadIds();
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loadIds]);

  const value = useMemo(
    () => ({ productIds, ready, refresh }),
    [productIds, ready, refresh],
  );

  return (
    <WishlistIdsContext.Provider value={value}>
      {children}
    </WishlistIdsContext.Provider>
  );
}

export function useWishlistIds(): WishlistIdsContextValue {
  const ctx = useContext(WishlistIdsContext);
  if (!ctx) {
    throw new Error("useWishlistIds must be used within WishlistIdsProvider");
  }
  return ctx;
}
