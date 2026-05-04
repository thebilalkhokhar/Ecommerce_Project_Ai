import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-16 md:py-24">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
        Terms of service
      </h1>
      <p className="mt-6 text-base leading-relaxed text-zinc-400">
        By using ShopOne, you agree to shop in good faith: accurate shipping
        information, acceptance of cash on delivery terms where selected, and
        compliance with applicable laws. We reserve the right to refuse service
        in cases of fraud or abuse.
      </p>
      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-400 hover:text-zinc-50"
        >
          ← Home
        </Link>
      </p>
    </div>
  );
}
