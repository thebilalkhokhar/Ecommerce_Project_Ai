from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_current_user, get_db
from app.models.user import User
from app.schemas.review import AdminReplyBody, ReactionCreate, ReviewOut
from app.services.crud import crud_review
from app.utils.cloudinary_client import upload_image

router = APIRouter(tags=["Reviews"])

MAX_REVIEW_IMAGES = 5
MAX_IMAGE_BYTES = 5 * 1024 * 1024


@router.post(
    "/products/{product_id}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_product_review(
    product_id: int,
    rating: Annotated[int, Form(..., ge=1, le=5)],
    comment: Annotated[str, Form(...)],
    images: list[UploadFile] | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewOut:
    image_urls: list[str] = []
    if images:
        for uf in images[:MAX_REVIEW_IMAGES]:
            if uf is None or not uf.filename:
                continue
            raw = await uf.read()
            if not raw:
                continue
            if len(raw) > MAX_IMAGE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Each image must be at most {MAX_IMAGE_BYTES // (1024 * 1024)} MB",
                )
            ctype = (uf.content_type or "").lower()
            if ctype and not ctype.startswith("image/"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only image uploads are allowed",
                )
            try:
                url = upload_image(raw, folder="ecommerce/reviews")
            except Exception as exc:  # noqa: BLE001 — surface as 502
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Could not store images",
                ) from exc
            image_urls.append(url)

    try:
        review = crud_review.create_review(
            db,
            current_user.id,
            product_id,
            rating=rating,
            comment=comment.strip(),
            image_urls=image_urls or None,
        )
    except ValueError as exc:
        msg = str(exc)
        if msg == "Product not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            ) from exc
        if msg == "You have already reviewed this product.":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed this product.",
            ) from exc
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this product.",
        ) from exc
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
