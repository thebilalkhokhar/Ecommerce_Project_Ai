from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_current_user, get_db
from app.models.user import User
from app.schemas.product import (
    ProductCanReviewOut,
    ProductCreate,
    ProductOut,
    ProductUpdate,
)
from app.services.crud import crud_product, crud_review
from app.utils.cloudinary_client import upload_image
from app.vector_store.faiss_manager import get_faiss_manager

router = APIRouter()


@router.get("", response_model=list[ProductOut])
def list_products(
    skip: int = 0,
    limit: int = 100,
    search: str | None = Query(None, description="Filter by name (case-insensitive substring)"),
    category_id: int | None = Query(None, description="Filter by category id"),
    db: Session = Depends(get_db),
) -> list[ProductOut]:
    products = crud_product.get_products(
        db,
        skip=skip,
        limit=limit,
        search=search,
        category_id=category_id,
    )
    return [ProductOut.model_validate(p) for p in products]


@router.get(
    "/{product_id}/related",
    response_model=list[ProductOut],
)
def get_related_products(
    product_id: int,
    db: Session = Depends(get_db),
) -> list[ProductOut]:
    product = crud_product.get_product_by_id(db, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    related = crud_product.get_related_products(
        db,
        product_id,
        product.category_id,
        limit=4,
    )
    return [ProductOut.model_validate(p) for p in related]


@router.get(
    "/{product_id}/can-review",
    response_model=ProductCanReviewOut,
)
def get_product_can_review(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProductCanReviewOut:
    state = crud_review.get_pdp_can_review_state(db, current_user.id, product_id)
    if state is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    can_review, reason = state
    return ProductCanReviewOut(can_review=can_review, reason=reason)


@router.get(
    "/{product_id}",
    response_model=ProductOut,
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
) -> ProductOut:
    product = crud_product.get_product_by_id(db, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return ProductOut.model_validate(product)


@router.post(
    "",
    response_model=ProductOut,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
) -> ProductOut:
    product = crud_product.create_product(db, product_in)
    text = f"{product.name}. {product.description or ''}".strip()
    get_faiss_manager().add_product_vector(product.id, text)
    return ProductOut.model_validate(product)


@router.put(
    "/{product_id}",
    response_model=ProductOut,
)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
) -> ProductOut:
    product = crud_product.update_product(db, product_id, product_in)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return ProductOut.model_validate(product)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_product(
    product_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
) -> None:
    try:
        crud_product.delete_product(db, product_id)
    except ValueError as exc:
        if str(exc) == "not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            ) from exc
        if str(exc) == "in_use":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product is referenced by orders and cannot be deleted.",
            ) from exc
        raise


@router.post(
    "/{product_id}/image",
    response_model=ProductOut,
    status_code=status.HTTP_200_OK,
)
async def upload_product_image(
    product_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
    file: UploadFile = File(...),
) -> ProductOut:
    data = await file.read()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file",
        )
    try:
        url = upload_image(data)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Image upload failed: {exc}",
        ) from exc
    product = crud_product.update_product_image(db, product_id, url)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return ProductOut.model_validate(product)
