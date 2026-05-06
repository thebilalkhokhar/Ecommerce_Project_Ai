"use client";

import { Toaster } from "react-hot-toast";

const lightToast = {
  background: "#ffffff",
  color: "#2A2C41",
  border: "1px solid #e5e7eb",
};

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        className: "",
        style: lightToast,
        success: {
          iconTheme: { primary: "#FF724C", secondary: "#ffffff" },
        },
        error: {
          iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
        },
      }}
    />
  );
}
