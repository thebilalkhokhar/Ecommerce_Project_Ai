import Link from "next/link";

const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 md:gap-12 lg:gap-16">
          <div className="space-y-5">
            <p className="text-lg font-semibold tracking-tight text-zinc-50">
              ShopOne
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
              A calm, minimal storefront for refined essentials — curated with
              care and built for clarity.
            </p>
            <p className="text-xs text-zinc-500">
              © {year} ShopOne. All rights reserved.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Shop
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link
                  href="/products"
                  className="text-zinc-400 transition-colors hover:text-zinc-50"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-zinc-400 transition-colors hover:text-zinc-50"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="text-zinc-400 transition-colors hover:text-zinc-50"
                >
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Support
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="text-zinc-400 transition-colors hover:text-zinc-50"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-zinc-400 transition-colors hover:text-zinc-50"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="text-zinc-400 transition-colors hover:text-zinc-50"
                >
                  Order tracking
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Policies
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-zinc-400 transition-colors hover:text-zinc-50"
                >
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-zinc-400 transition-colors hover:text-zinc-50"
                >
                  Terms of service
                </Link>
              </li>
              <li>
                <Link
                  href="/refunds"
                  className="text-zinc-400 transition-colors hover:text-zinc-50"
                >
                  Refund policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
