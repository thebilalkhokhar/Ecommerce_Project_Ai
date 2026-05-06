from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.review import Review, ReviewReaction
from app.schemas.review import (
    AdminReviewListOut,
    ReviewOut,
    ReviewUserSnippet,
)


def _user_has_ordered_product(
    db: Session,
    user_id: int,
    product_id: int,
) -> bool:
    """True if the user has an order (pending through delivered) that includes this product."""
    stmt = (
        select(OrderItem.id)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.user_id == user_id,
            OrderItem.product_id == product_id,
            Order.status.in_(
                [
                    OrderStatus.pending,
                    OrderStatus.processing,
                    OrderStatus.shipped,
                    OrderStatus.delivered,
                ]
            ),
        )
        .limit(1)
    )
    return db.scalar(stmt) is not None


def _refresh_product_review_stats(db: Session, product_id: int) -> None:
    approved_only = and_(
        Review.product_id == product_id,
        Review.is_approved.is_(True),
    )
    avg_val = db.scalar(select(func.avg(Review.rating)).where(approved_only))
    cnt = db.scalar(select(func.count(Review.id)).where(approved_only))
    product = db.get(Product, product_id)
    if product is None:
        return
    product.average_rating = Decimal(str(round(float(avg_val or 0), 2)))
    product.total_reviews = int(cnt or 0)
    db.add(product)
    db.commit()


def _reaction_counts_bulk(
    db: Session,
    review_ids: list[int],
) -> dict[int, dict[bool, int]]:
    if not review_ids:
        return {}
    rows = db.execute(
        select(
            ReviewReaction.review_id,
            ReviewReaction.is_like,
            func.count(ReviewReaction.id),
        )
        .where(ReviewReaction.review_id.in_(review_ids))
        .group_by(ReviewReaction.review_id, ReviewReaction.is_like),
    ).all()
    out: dict[int, dict[bool, int]] = {rid: {True: 0, False: 0} for rid in review_ids}
    for row in rows:
        rid = int(row[0])
        is_like = bool(row[1])
        c = int(row[2])
        if rid not in out:
            out[rid] = {True: 0, False: 0}
        out[rid][is_like] = c
    return out


def _normalize_image_urls(raw: object) -> list[str]:
    if raw is None:
        return []
    if not isinstance(raw, list):
        return []
    return [str(u) for u in raw if u]


def _build_review_out(
    db: Session,
    review: Review,
    counts: dict[int, dict[bool, int]],
) -> ReviewOut:
    if review.user is None:
        review = db.scalars(
            select(Review)
            .options(selectinload(Review.user))
            .where(Review.id == review.id),
        ).one()
    c = counts.get(review.id, {True: 0, False: 0})
    return ReviewOut(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        rating=review.rating,
        comment=review.comment,
        admin_reply=review.admin_reply,
        is_verified_purchase=review.is_verified_purchase,
        is_approved=review.is_approved,
        image_urls=_normalize_image_urls(review.image_urls),
        user=ReviewUserSnippet(name=review.user.full_name),
        likes_count=c[True],
        dislikes_count=c[False],
    )


def _to_review_out(db: Session, review: Review) -> ReviewOut:
    c = _reaction_counts_bulk(db, [review.id])
    return _build_review_out(db, review, c)


def _to_admin_review_list_out(
    db: Session,
    review: Review,
    counts: dict[int, dict[bool, int]],
) -> AdminReviewListOut:
    base = _build_review_out(db, review, counts)
    product_name = ""
    if review.product is not None:
        product_name = review.product.name
    elif review.product_id:
        p = db.get(Product, review.product_id)
        product_name = p.name if p else ""
    return AdminReviewListOut(**base.model_dump(), product_name=product_name)


def create_review(
    db: Session,
    user_id: int,
    product_id: int,
    *,
    rating: int,
    comment: str,
    image_urls: list[str] | None = None,
) -> Review:
    product = db.get(Product, product_id)
    if product is None:
        raise ValueError("Product not found")

    verified = _user_has_ordered_product(db, user_id, product_id)
    review = Review(
        product_id=product_id,
        user_id=user_id,
        rating=rating,
        comment=comment,
        is_verified_purchase=verified,
        is_approved=False,
        image_urls=list(image_urls or []),
    )
    db.add(review)
    db.commit()
    _refresh_product_review_stats(db, product_id)
    return db.scalars(
        select(Review)
        .options(selectinload(Review.user))
        .where(Review.id == review.id),
    ).one()


def add_admin_reply(db: Session, review_id: int, reply_text: str) -> Review | None:
    review = db.get(Review, review_id)
    if review is None:
        return None
    review.admin_reply = reply_text
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def admin_update_review(
    db: Session,
    review_id: int,
    *,
    is_approved: bool | None = None,
    admin_reply: str | None = None,
) -> Review | None:
    review = db.get(Review, review_id)
    if review is None:
        return None
    if is_approved is not None:
        review.is_approved = is_approved
    if admin_reply is not None:
        review.admin_reply = admin_reply
    db.add(review)
    db.commit()
    pid = review.product_id
    _refresh_product_review_stats(db, pid)
    return db.scalars(
        select(Review)
        .options(selectinload(Review.user), selectinload(Review.product))
        .where(Review.id == review_id),
    ).one()


def list_all_reviews_admin(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[AdminReviewListOut]:
    stmt = (
        select(Review)
        .options(selectinload(Review.user), selectinload(Review.product))
        .order_by(Review.id.desc())
        .offset(skip)
        .limit(limit)
    )
    reviews = list(db.scalars(stmt).all())
    ids = [r.id for r in reviews]
    counts = _reaction_counts_bulk(db, ids)
    return [_to_admin_review_list_out(db, r, counts) for r in reviews]


def toggle_reaction(
    db: Session,
    user_id: int,
    review_id: int,
    is_like: bool,
) -> tuple[str, ReviewReaction | None]:
    """
    Upsert reaction. Same type as existing -> remove. Different -> update type.
    Returns (action, reaction_or_none).
    """
    review = db.get(Review, review_id)
    if review is None:
        raise ValueError("Review not found")
    if not review.is_approved:
        raise ValueError("Review not found")

    stmt = select(ReviewReaction).where(
        and_(
            ReviewReaction.review_id == review_id,
            ReviewReaction.user_id == user_id,
        ),
    )
    existing = db.scalars(stmt).first()

    if existing is None:
        reaction = ReviewReaction(
            review_id=review_id,
            user_id=user_id,
            is_like=is_like,
        )
        db.add(reaction)
        db.commit()
        db.refresh(reaction)
        return ("added", reaction)

    if existing.is_like == is_like:
        db.delete(existing)
        db.commit()
        return ("removed", None)

    existing.is_like = is_like
    db.add(existing)
    db.commit()
    db.refresh(existing)
    return ("updated", existing)


def list_reviews_for_product(
    db: Session,
    product_id: int,
    skip: int = 0,
    limit: int = 20,
) -> list[ReviewOut] | None:
    if db.get(Product, product_id) is None:
        return None

    stmt = (
        select(Review)
        .options(selectinload(Review.user))
        .where(
            Review.product_id == product_id,
            Review.is_approved.is_(True),
        )
        .order_by(Review.id.desc())
        .offset(skip)
        .limit(limit)
    )
    reviews = list(db.scalars(stmt).all())
    ids = [r.id for r in reviews]
    counts = _reaction_counts_bulk(db, ids)

    return [_build_review_out(db, r, counts) for r in reviews]


def review_to_out(db: Session, review: Review) -> ReviewOut:
    return _to_review_out(db, review)


def admin_review_to_list_out(db: Session, review: Review) -> AdminReviewListOut:
    counts = _reaction_counts_bulk(db, [review.id])
    return _to_admin_review_list_out(db, review, counts)
