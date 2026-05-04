import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-16 md:py-24">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
        Contact
      </h1>
      <p className="mt-6 text-base leading-relaxed text-zinc-400">
        We&apos;re here to help with orders, sizing, and general questions. Reach
        out and we&apos;ll respond as soon as we can.
      </p>
      <p className="mt-8 text-sm text-zinc-500">
        Email:{" "}
        <a
          href="mailto:support@shopone.example"
          className="text-zinc-300 underline-offset-4 hover:text-zinc-50 hover:underline"
        >
          support@shopone.example
        </a>
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
