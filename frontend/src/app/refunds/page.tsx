import Link from "next/link";

export default function RefundsPage() {
  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-16 md:py-24">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
        Refund policy
      </h1>
      <p className="mt-6 text-base leading-relaxed text-zinc-400">
        We offer a 7‑day return window for unused items in original packaging.
        Contact support with your order number to start a return. Refunds are
        processed after we receive and inspect the item.
      </p>
      <p className="mt-10">
        <Link
          href="/orders"
          className="text-sm font-medium text-zinc-400 hover:text-zinc-50"
        >
          View your orders
        </Link>
      </p>
    </div>
  );
}
