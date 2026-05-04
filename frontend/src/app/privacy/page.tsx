import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-16 md:py-24">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
        Privacy policy
      </h1>
      <p className="mt-6 text-base leading-relaxed text-zinc-400">
        ShopOne respects your privacy. We collect only the information needed to
        process orders and improve your experience, and we do not sell your
        personal data. For questions, contact us via the support email on our
        contact page.
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
