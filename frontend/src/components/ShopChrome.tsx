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

/** Hides customer Navbar, Footer, and chat when inside `/admin`. */
export function ShopChrome({ children }: ShopChromeProps) {
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/admin");

  return (
    <>
      {!isAdminArea && <Navbar />}
      <div className="print:hidden">
        <AppToaster />
      </div>
      <div className="flex min-h-0 flex-1 flex-col print:bg-white">{children}</div>
      {!isAdminArea && <Footer />}
      {!isAdminArea && (
        <div className="print:hidden">
          <ChatbotWidget />
        </div>
      )}
    </>
  );
}
