import Link from "next/link";

const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-surface print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 md:gap-12 lg:gap-16">
          <div className="space-y-5">
            <p className="text-lg font-semibold tracking-tight text-textMain">
              ShopOne
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-textMain/70">
              A calm, minimal storefront for refined essentials — curated with
              care and built for clarity.
            </p>
            <p className="text-xs text-textMain/60">
              © {year} ShopOne. All rights reserved.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-textMain/60">
              Shop
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link
                  href="/products"
                  className="text-textMain/70 transition-colors hover:text-textMain"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-textMain/70 transition-colors hover:text-textMain"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="text-textMain/70 transition-colors hover:text-textMain"
                >
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-textMain/60">
              Support
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="text-textMain/70 transition-colors hover:text-textMain"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-textMain/70 transition-colors hover:text-textMain"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="text-textMain/70 transition-colors hover:text-textMain"
                >
                  Order tracking
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-textMain/60">
              Policies
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-textMain/70 transition-colors hover:text-textMain"
                >
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-textMain/70 transition-colors hover:text-textMain"
                >
                  Terms of service
                </Link>
              </li>
              <li>
                <Link
                  href="/refunds"
                  className="text-textMain/70 transition-colors hover:text-textMain"
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
