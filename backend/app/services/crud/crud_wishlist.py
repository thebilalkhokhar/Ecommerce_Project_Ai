from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.product import Product
from app.models.wishlist import Wishlist


def list_wishlist_for_user(db: Session, user_id: int) -> list[Wishlist]:
    stmt = (
        select(Wishlist)
        .where(Wishlist.user_id == user_id)
        .options(selectinload(Wishlist.product).selectinload(Product.category))
        .order_by(Wishlist.id.desc())
    )
    return list(db.scalars(stmt).all())


def toggle_wishlist(
    db: Session,
    user_id: int,
    product_id: int,
) -> Literal["added", "removed"]:
    if db.get(Product, product_id) is None:
        raise ValueError("product_not_found")

    stmt = select(Wishlist).where(
        Wishlist.user_id == user_id,
        Wishlist.product_id == product_id,
    )
    existing = db.scalar(stmt)
    if existing is not None:
        db.delete(existing)
        db.commit()
        return "removed"

    entry = Wishlist(user_id=user_id, product_id=product_id)
    db.add(entry)
    db.commit()
    return "added"
