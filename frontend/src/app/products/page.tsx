import { Suspense } from "react";
import { ProductsClient } from "./ProductsClient";

function ProductsFallback() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col px-4 py-12">
      <div
        className="flex flex-1 flex-col items-center justify-center gap-4 py-24"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="h-1 w-24 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gray-200" />
        </div>
        <p className="text-sm text-textMain/60">Loading…</p>
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsFallback />}>
      <ProductsClient />
    </Suspense>
  );
}
