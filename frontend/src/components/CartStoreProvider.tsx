"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useCartStore } from "@/store/cartStore";

const CartHydratedContext = createContext(false);

/** True after Zustand persist has rehydrated from localStorage (client-only). */
export function useCartStoreHydrated(): boolean {
  return useContext(CartHydratedContext);
}

/**
 * Must wrap the app so cart state is rehydrated after mount (avoids SSR/hydration mismatch).
 * Persist middleware uses skipHydration; this provider calls rehydrate() once on the client.
 */
export function CartStoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    void useCartStore.persist.rehydrate();
    if (useCartStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  return (
    <CartHydratedContext.Provider value={hydrated}>
      {children}
    </CartHydratedContext.Provider>
  );
}
