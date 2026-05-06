from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_db
from app.models.user import User
from app.schemas.review import AdminReviewListOut, AdminReviewUpdate
from app.services.crud import crud_review

router = APIRouter(tags=["Admin reviews"])


@router.get("/reviews", response_model=list[AdminReviewListOut])
def list_all_reviews(
    skip: int = 0,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
) -> list[AdminReviewListOut]:
    return crud_review.list_all_reviews_admin(db, skip=skip, limit=limit)


@router.put("/reviews/{review_id}", response_model=AdminReviewListOut)
def update_review_moderation(
    review_id: int,
    body: AdminReviewUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
) -> AdminReviewListOut:
    review = crud_review.admin_update_review(
        db,
        review_id,
        is_approved=body.is_approved,
        admin_reply=body.admin_reply,
    )
    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    return crud_review.admin_review_to_list_out(db, review)
