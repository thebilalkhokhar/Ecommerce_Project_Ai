from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_current_user, get_db
from app.models.user import User
from app.schemas.review import AdminReplyBody, ReactionCreate, ReviewCreate, ReviewOut
from app.services.crud import crud_review

router = APIRouter(tags=["Reviews"])


@router.post(
    "/products/{product_id}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
def create_product_review(
    product_id: int,
    body: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewOut:
    try:
        review = crud_review.create_review(db, current_user.id, product_id, body)
    except ValueError as exc:
        if str(exc) == "Product not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            ) from exc
        raise
    return crud_review.review_to_out(db, review)


@router.get("/products/{product_id}/reviews", response_model=list[ReviewOut])
def list_product_reviews(
    product_id: int,
    skip: int = 0,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[ReviewOut]:
    data = crud_review.list_reviews_for_product(db, product_id, skip=skip, limit=limit)
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return data


@router.post("/reviews/{review_id}/reply", response_model=ReviewOut)
def post_admin_reply(
    review_id: int,
    body: AdminReplyBody,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
) -> ReviewOut:
    review = crud_review.add_admin_reply(db, review_id, body.reply)
    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    return crud_review.review_to_out(db, review)


@router.post("/reviews/{review_id}/react", status_code=status.HTTP_200_OK)
def post_review_reaction(
    review_id: int,
    body: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    try:
        action, _ = crud_review.toggle_reaction(
            db,
            current_user.id,
            review_id,
            body.is_like,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        ) from exc
    return {"status": action}
