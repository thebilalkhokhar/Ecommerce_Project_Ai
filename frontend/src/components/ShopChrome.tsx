"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppToaster } from "@/components/AppToaster";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

type ShopChromeProps = {
  children: ReactNode;
};

/**
 * Full-width “canvas” routes: no floating navbar, footer, or chat (print-ready
 * invoice, admin uses its own layout).
 */
function isInvoiceCanvasPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/invoice") ||
    pathname.includes("/receipt")
  );
}

/** Hides customer Navbar, Footer, and chat when inside `/admin` or invoice views. */
export function ShopChrome({ children }: ShopChromeProps) {
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/admin");
  const invoiceCanvas = isInvoiceCanvasPath(pathname);
  const showStoreNav = !isAdminArea && !invoiceCanvas;

  return (
    <>
      {showStoreNav && <Navbar />}
      <div className="print:hidden">
        <AppToaster />
      </div>
      <div className="flex min-h-0 flex-1 flex-col print:bg-white">{children}</div>
      {showStoreNav && <Footer />}
      {showStoreNav && (
        <div className="print:hidden">
          <ChatbotWidget />
        </div>
      )}
    </>
  );
}
