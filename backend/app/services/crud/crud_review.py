from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.review import Review, ReviewReaction
from app.schemas.review import ReviewCreate, ReviewOut, ReviewUserSnippet


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
    avg_val = db.scalar(
        select(func.avg(Review.rating)).where(Review.product_id == product_id),
    )
    cnt = db.scalar(
        select(func.count(Review.id)).where(Review.product_id == product_id),
    )
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


def _to_review_out(db: Session, review: Review) -> ReviewOut:
    if review.user is None:
        review = db.scalars(
            select(Review)
            .options(selectinload(Review.user))
            .where(Review.id == review.id),
        ).one()
    c = _reaction_counts_bulk(db, [review.id]).get(
        review.id,
        {True: 0, False: 0},
    )
    return ReviewOut(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        rating=review.rating,
        comment=review.comment,
        admin_reply=review.admin_reply,
        is_verified_purchase=review.is_verified_purchase,
        user=ReviewUserSnippet(name=review.user.full_name),
        likes_count=c[True],
        dislikes_count=c[False],
    )


def create_review(
    db: Session,
    user_id: int,
    product_id: int,
    review_in: ReviewCreate,
) -> Review:
    product = db.get(Product, product_id)
    if product is None:
        raise ValueError("Product not found")

    verified = _user_has_ordered_product(db, user_id, product_id)
    review = Review(
        product_id=product_id,
        user_id=user_id,
        rating=review_in.rating,
        comment=review_in.comment,
        is_verified_purchase=verified,
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
        .where(Review.product_id == product_id)
        .order_by(Review.id.desc())
        .offset(skip)
        .limit(limit)
    )
    reviews = list(db.scalars(stmt).all())
    ids = [r.id for r in reviews]
    counts = _reaction_counts_bulk(db, ids)

    result: list[ReviewOut] = []
    for r in reviews:
        c = counts.get(r.id, {True: 0, False: 0})
        result.append(
            ReviewOut(
                id=r.id,
                product_id=r.product_id,
                user_id=r.user_id,
                rating=r.rating,
                comment=r.comment,
                admin_reply=r.admin_reply,
                is_verified_purchase=r.is_verified_purchase,
                user=ReviewUserSnippet(name=r.user.full_name),
                likes_count=c[True],
                dislikes_count=c[False],
            ),
        )
    return result


def review_to_out(db: Session, review: Review) -> ReviewOut:
    return _to_review_out(db, review)
