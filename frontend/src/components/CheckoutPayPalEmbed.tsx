"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import api from "@/lib/axios";
import { useCartStore } from "@/store/cartStore";

function apiErrorMessage(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return "Network error. Is the API running?";
  }
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((item: unknown) => {
      if (item && typeof item === "object" && "msg" in item) {
        return String((item as { msg: string }).msg);
      }
      return JSON.stringify(item);
    });
    if (parts.length) return parts.join(" ");
  }
  return "Could not complete request. Try again.";
}

type CheckoutPayPalEmbedProps = {
  orderId: number;
};

/**
 * Server creates/captures PayPal orders; SDK only launches the PayPal popup.
 */
export function CheckoutPayPalEmbed({ orderId }: CheckoutPayPalEmbedProps) {
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

  if (!clientId) {
    return (
      <p className="text-xs text-red-700">
        Set <code className="text-[11px]">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> in{" "}
        <code className="text-[11px]">frontend/.env</code> (sandbox or live).
      </p>
    );
  }

  return (
    <PayPalScriptProvider
      options={{ clientId, currency: "USD", intent: "capture" }}
    >
      <PayPalButtons
        style={{ layout: "vertical", label: "paypal" }}
        createOrder={async () => {
          const { data } = await api.post<{ paypal_order_id: string }>(
            `/payments/paypal-create-order/${orderId}`,
          );
          return data.paypal_order_id;
        }}
        onApprove={async (data) => {
          const toastId = toast.loading("Confirming payment…");
          try {
            await api.post(`/payments/paypal-capture-order/${orderId}`, {
              paypal_order_id: data.orderID,
            });
            toast.success("Payment successful!", { id: toastId });
            clearCart();
            router.push(`/orders/${orderId}?success=true`);
          } catch (err: unknown) {
            toast.error(apiErrorMessage(err), { id: toastId });
          }
        }}
        onError={() => {
          toast.error(
            "PayPal could not load or the payment window closed. Try again.",
          );
        }}
      />
    </PayPalScriptProvider>
  );
}
