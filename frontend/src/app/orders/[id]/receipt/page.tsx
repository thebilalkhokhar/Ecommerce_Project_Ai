"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Legacy URL: `/orders/:id/receipt` → canonical invoice at `/invoice/:id`. */
export default function OrderReceiptRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params.id;
  const orderId =
    typeof idParam === "string" ? idParam : Array.isArray(idParam) ? idParam[0] : "";

  useEffect(() => {
    if (orderId) {
      router.replace(`/invoice/${orderId}`);
    }
  }, [orderId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-sm text-gray-600 print:hidden">
      <p>Opening invoice…</p>
    </div>
  );
}
