import Link from "next/link";

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-16 md:py-24">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
        FAQs
      </h1>
      <p className="mt-6 text-base leading-relaxed text-zinc-400">
        <strong className="font-medium text-zinc-200">Shipping?</strong>{" "}
        Delivery typically takes 3–5 business days. <br />
        <br />
        <strong className="font-medium text-zinc-200">Returns?</strong>{" "}
        Unused items in original packaging may be returned within 7 days.{" "}
        <br />
        <br />
        <strong className="font-medium text-zinc-200">Payment?</strong> We
        currently offer cash on delivery at checkout.
      </p>
      <p className="mt-10">
        <Link
          href="/products"
          className="text-sm font-medium text-zinc-400 hover:text-zinc-50"
        >
          ← Back to shop
        </Link>
      </p>
    </div>
  );
}
