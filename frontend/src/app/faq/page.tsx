import Link from "next/link";

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-16 md:py-24">
      <h1 className="text-3xl font-semibold tracking-tight text-textMain">
        FAQs
      </h1>
      <p className="mt-6 text-base leading-relaxed text-textMain/70">
        <strong className="font-medium text-textMain">Shipping?</strong>{" "}
        Delivery typically takes 3–5 business days. <br />
        <br />
        <strong className="font-medium text-textMain">Returns?</strong>{" "}
        Unused items in original packaging may be returned within 7 days.{" "}
        <br />
        <br />
        <strong className="font-medium text-textMain">Payment?</strong> We
        currently offer cash on delivery at checkout.
      </p>
      <p className="mt-10">
        <Link
          href="/products"
          className="text-sm font-medium text-textMain/70 hover:text-textMain"
        >
          ← Back to shop
        </Link>
      </p>
    </div>
  );
}
