import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-16 md:py-24">
      <h1 className="text-3xl font-semibold tracking-tight text-textMain">
        Contact
      </h1>
      <p className="mt-6 text-base leading-relaxed text-textMain/70">
        We&apos;re here to help with orders, sizing, and general questions. Reach
        out and we&apos;ll respond as soon as we can.
      </p>
      <p className="mt-8 text-sm text-textMain/60">
        Email:{" "}
        <a
          href="mailto:support@shopone.example"
          className="text-textMain/80 underline-offset-4 hover:text-textMain hover:underline"
        >
          support@shopone.example
        </a>
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
