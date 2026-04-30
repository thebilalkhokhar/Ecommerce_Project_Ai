from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_current_user, get_db
from app.models.user import User
from app.schemas.product import ProductCreate, ProductOut
from app.services.crud import crud_product
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


@router.post(
    "",
    response_model=ProductOut,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProductOut:
    product = crud_product.create_product(db, product_in)
    text = f"{product.name}. {product.description or ''}".strip()
    get_faiss_manager().add_product_vector(product.id, text)
    return ProductOut.model_validate(product)


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
