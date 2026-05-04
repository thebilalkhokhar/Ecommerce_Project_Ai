"""
Seed the database with realistic dummy data.

Run from the backend directory:
    python -m scripts.seed

Optional:
    python -m scripts.seed --no-wipe   # skip truncate (will likely fail on unique emails)
    python -m scripts.seed --yes       # skip interactive wipe confirmation (default wipes when TTY)

Environment:
    SEED_YES=1  same as --yes (non-interactive truncate)
"""

from __future__ import annotations

import argparse
import os
import random
import sys
from decimal import Decimal
from pathlib import Path

from faker import Faker
from sqlalchemy import select, text
from sqlalchemy.orm import Session, selectinload

# Ensure backend root is on path when executed as script
_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

import app.db.base  # noqa: F401 — register models
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models import (
    Category,
    Order,
    OrderItem,
    OrderStatus,
    Product,
    ProductVariant,
    Review,
    User,
)

fake = Faker()

PREMIUM_IMAGE_URLS = [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1585386959920-a415b1ebb0ff?q=80&w=800&auto=format&fit=crop",
]

CATEGORY_SEED = [
    ("Apparel", "Everyday fits and layers."),
    ("Accessories", "Bags, belts, and finishing touches."),
    ("Workspace", "Desk staples and creative tools."),
    ("Essentials", "Daily carry and home bases."),
    ("Footwear", "Sneakers, boots, and slides."),
]

VARIANT_BLUEPRINTS: list[list[tuple[str, float]]] = [
    [("Size S", 0.0), ("Size M", 2.5), ("Size L", 5.0)],
    [("Black", 0.0), ("White", 0.0), ("Navy", 3.0)],
    [("Standard", 0.0), ("Pro", 12.0)],
]

DEFAULT_SEED_PASSWORD = "pass12345"


def _money(value: float) -> Decimal:
    return Decimal(str(round(value, 2)))


def wipe_database(db: Session) -> None:
    url = settings.DATABASE_URL.lower()
    print("Clearing existing data...")
    if "postgresql" in url or "postgres" in url:
        db.execute(
            text(
                """
                TRUNCATE TABLE
                    reviewreaction,
                    review,
                    orderitem,
                    wishlist,
                    "order",
                    refreshtoken,
                    productvariant,
                    product,
                    category,
                    "user"
                RESTART IDENTITY CASCADE
                """
            )
        )
    else:
        # SQLite / other: delete in dependency order
        for stmt in (
            'DELETE FROM "reviewreaction"',
            'DELETE FROM "review"',
            'DELETE FROM "orderitem"',
            'DELETE FROM "wishlist"',
            'DELETE FROM "order"',
            'DELETE FROM "refreshtoken"',
            'DELETE FROM "productvariant"',
            'DELETE FROM "product"',
            'DELETE FROM "category"',
            'DELETE FROM "user"',
        ):
            db.execute(text(stmt))
    db.commit()
    print("Database cleared.")


def seed_categories(db: Session) -> list[Category]:
    print("Seeding categories...")
    rows: list[Category] = []
    for name, desc in CATEGORY_SEED:
        c = Category(name=name, description=desc)
        db.add(c)
        rows.append(c)
    db.flush()
    return rows


def seed_users(db: Session, password_plain: str) -> tuple[User, list[User]]:
    print("Seeding users...")
    hashed = get_password_hash(password_plain)
    admin = User(
        email="admin@example.com",
        hashed_password=hashed,
        full_name="Seed Admin",
        phone_number="+1 555 0100",
        address_line_1="100 Admin Way",
        address_line_2=None,
        city="Portland",
        state="OR",
        postal_code="97201",
        is_active=True,
        is_admin=True,
    )
    db.add(admin)
    db.flush()

    customers: list[User] = []
    n_customers = random.randint(5, 10)
    for i in range(n_customers):
        u = User(
            email=f"customer{i + 1}@example.com",
            hashed_password=hashed,
            full_name=fake.name(),
            phone_number=fake.phone_number()[:32],
            address_line_1=fake.street_address(),
            address_line_2=fake.secondary_address() if random.random() > 0.7 else None,
            city=fake.city(),
            state=fake.state_abbr(),
            postal_code=fake.postcode(),
            is_active=True,
            is_admin=False,
        )
        db.add(u)
        customers.append(u)
    db.flush()
    return admin, customers


def seed_products_and_variants(
    db: Session,
    categories: list[Category],
) -> list[Product]:
    print("Seeding products and variants...")
    n_products = random.randint(25, 30)
    products: list[Product] = []
    for _ in range(n_products):
        cat = random.choice(categories)
        name = fake.catch_phrase()[:250]
        desc = fake.paragraph(nb_sentences=random.randint(2, 4))
        price = _money(random.uniform(12.0, 320.0))
        img = random.choice(PREMIUM_IMAGE_URLS)
        with_variants = random.random() < 0.5

        if with_variants:
            base_stock = 0
        else:
            base_stock = random.randint(15, 180)

        p = Product(
            name=name,
            description=desc,
            price=price,
            stock_quantity=base_stock,
            average_rating=Decimal("0.00"),
            total_reviews=0,
            category_id=cat.id,
            image_url=img,
        )
        db.add(p)
        db.flush()

        if with_variants:
            blueprint = random.choice(VARIANT_BLUEPRINTS)
            for vname, adj in blueprint:
                vstock = random.randint(8, 90)
                db.add(
                    ProductVariant(
                        product_id=p.id,
                        name=vname,
                        price_adjustment=float(adj),
                        stock_quantity=vstock,
                    )
                )
        products.append(p)

    db.commit()
    return products


def _pick_order_quantity(
    product: Product,
    variant: ProductVariant | None,
    desired: int,
) -> tuple[int, ProductVariant | None]:
    if variant is not None:
        available = variant.stock_quantity
        q = min(desired, max(0, available))
        return q, variant
    available = product.stock_quantity
    q = min(desired, max(0, available))
    return q, None


def seed_orders(
    db: Session,
    customers: list[User],
    products: list[Product],
) -> set[tuple[int, int]]:
    print("Seeding orders...")
    purchased: set[tuple[int, int]] = set()
    n_orders = random.randint(5, 10)
    status_pool = [
        OrderStatus.pending,
        OrderStatus.shipped,
        OrderStatus.delivered,
    ]

    for _ in range(n_orders):
        user = random.choice(customers)
        status = random.choice(status_pool)
        n_lines = random.randint(1, 3)
        picks = random.sample(products, min(n_lines, len(products)))

        lines: list[tuple[Product, int, Decimal, str | None, ProductVariant | None]] = []
        total = Decimal("0.00")

        for product in picks:
            variants = product.variants
            variant: ProductVariant | None = None
            if variants and random.random() < 0.65:
                variant = random.choice(variants)

            desired_q = random.randint(1, 3)
            qty, effective_variant = _pick_order_quantity(product, variant, desired_q)
            if qty <= 0:
                continue

            if effective_variant is not None:
                unit = product.price + Decimal(str(effective_variant.price_adjustment))
                vname = effective_variant.name
                effective_variant.stock_quantity -= qty
            else:
                unit = product.price
                vname = None
                product.stock_quantity -= qty

            line_total = unit * qty
            total += line_total
            lines.append((product, qty, unit, vname, effective_variant))

        if not lines:
            continue

        order = Order(
            user_id=user.id,
            total_price=_money(float(total)),
            status=status,
            is_cod=True,
        )
        db.add(order)
        db.flush()

        for product, qty, unit_price, vname, _v in lines:
            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=qty,
                    unit_price=unit_price,
                    variant_name=vname,
                )
            )
            purchased.add((user.id, product.id))

    db.commit()
    return purchased


def seed_reviews(
    db: Session,
    products: list[Product],
    customers: list[User],
    verified_pairs: set[tuple[int, int]],
) -> None:
    print("Seeding reviews...")
    used: set[tuple[int, int]] = set()
    for product in products:
        n = random.randint(1, 3)
        reviewers = random.sample(customers, min(n, len(customers)))
        for user in reviewers:
            if (user.id, product.id) in used:
                continue
            used.add((user.id, product.id))
            rating = random.randint(1, 5)
            comment = fake.paragraph(nb_sentences=random.randint(1, 3))
            verified = (user.id, product.id) in verified_pairs and random.random() < 0.85
            db.add(
                Review(
                    product_id=product.id,
                    user_id=user.id,
                    rating=rating,
                    comment=comment,
                    admin_reply=None,
                    is_verified_purchase=verified,
                )
            )
    db.commit()


def refresh_product_review_stats(db: Session, product_ids: list[int]) -> None:
    print("Updating product review aggregates...")
    for pid in product_ids:
        ratings = list(
            db.scalars(select(Review.rating).where(Review.product_id == pid)).all()
        )
        product = db.get(Product, pid)
        if product is None:
            continue
        if ratings:
            product.total_reviews = len(ratings)
            product.average_rating = _money(sum(ratings) / len(ratings))
        else:
            product.total_reviews = 0
            product.average_rating = Decimal("0.00")
        db.add(product)
    db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed ecommerce database")
    parser.add_argument(
        "--no-wipe",
        action="store_true",
        help="Do not truncate tables first (unsafe if data already exists)",
    )
    parser.add_argument(
        "--yes",
        "-y",
        action="store_true",
        help="Skip interactive confirmation before wiping",
    )
    parser.add_argument(
        "--password",
        default=DEFAULT_SEED_PASSWORD,
        help=f"Plain password for all seeded users (default: {DEFAULT_SEED_PASSWORD})",
    )
    args = parser.parse_args()

    auto_yes = args.yes or os.environ.get("SEED_YES") == "1"

    db = SessionLocal()
    try:
        if not args.no_wipe:
            if not auto_yes and sys.stdin.isatty():
                print(
                    "\n*** This will DELETE all rows in core tables (users, products, orders, …). ***\n"
                )
                ans = input("Continue? [y/N]: ").strip().lower()
                if ans != "y":
                    print("Aborted.")
                    return
            elif not auto_yes:
                print(
                    "Refusing to wipe in non-interactive mode without --yes or SEED_YES=1."
                )
                return
            wipe_database(db)
        else:
            print("Skipping wipe (--no-wipe).")

        categories = seed_categories(db)
        db.commit()

        _admin, customers = seed_users(db, args.password)
        db.commit()
        print(f"Created admin (admin@example.com) and {len(customers)} customers.")

        # Re-load products with variants for order line picking
        db.expire_all()
        products = seed_products_and_variants(db, categories)

        stmt = select(Product).options(selectinload(Product.variants))
        products = list(db.scalars(stmt).unique().all())

        verified_pairs = seed_orders(db, customers, products)
        seed_reviews(db, products, customers, verified_pairs)
        refresh_product_review_stats(db, [p.id for p in products])

        print("\nDone.")
        print(f"  Login: admin@example.com / {args.password}")
        print(f"  Customers: customer1@example.com … (same password)")
        print(f"  Products: {len(products)}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
