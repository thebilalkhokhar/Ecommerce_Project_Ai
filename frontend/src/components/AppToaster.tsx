"use client";

import { Toaster } from "react-hot-toast";

const darkToast = {
  background: "#18181b",
  color: "#fafafa",
  border: "1px solid #27272a",
};

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        className: "",
        style: darkToast,
        success: { iconTheme: { primary: "#fafafa", secondary: "#18181b" } },
        error: { iconTheme: { primary: "#fca5a5", secondary: "#18181b" } },
      }}
    />
  );
}
