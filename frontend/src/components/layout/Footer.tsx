import Link from "next/link";

const year = new Date().getFullYear();

const linkClass =
  "inline-flex rounded-lg px-1 py-0.5 text-textMain/70 transition-all hover:bg-primary/5 hover:text-primary";

export function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-background print:hidden">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:py-14">
        <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 via-surface to-secondary/10 p-8 shadow-sm md:p-12">
          <div
            className="pointer-events-none absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-secondary/10 blur-3xl"
            aria-hidden
          />

          <div className="relative z-10 grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 md:gap-12 lg:gap-14">
            <div className="space-y-5">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-primary">
                ShopOne
              </span>
              <p className="max-w-xs text-base leading-relaxed text-textMain/70">
                A calm, minimal storefront for refined essentials — curated
                with care and built for clarity.
              </p>
              <p className="text-xs text-textMain/50">
                © {year} ShopOne. All rights reserved.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-textMain/50">
                Shop
              </h3>
              <ul className="mt-5 space-y-2.5 text-sm">
                <li>
                  <Link href="/products" className={linkClass}>
                    Products
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className={linkClass}>
                    Categories
                  </Link>
                </li>
                <li>
                  <Link href="/wishlist" className={linkClass}>
                    Wishlist
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-textMain/50">
                Support
              </h3>
              <ul className="mt-5 space-y-2.5 text-sm">
                <li>
                  <Link href="/contact" className={linkClass}>
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className={linkClass}>
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className={linkClass}>
                    Order tracking
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-textMain/50">
                Policies
              </h3>
              <ul className="mt-5 space-y-2.5 text-sm">
                <li>
                  <Link href="/privacy" className={linkClass}>
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className={linkClass}>
                    Terms of service
                  </Link>
                </li>
                <li>
                  <Link href="/refunds" className={linkClass}>
                    Refund policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
