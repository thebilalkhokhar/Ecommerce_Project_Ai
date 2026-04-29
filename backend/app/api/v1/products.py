from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.product import ProductCreate, ProductOut
from app.services.crud import crud_product
from app.vector_store.faiss_manager import get_faiss_manager

router = APIRouter()


@router.get("", response_model=list[ProductOut])
def list_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> list[ProductOut]:
    return crud_product.get_products(db, skip=skip, limit=limit)


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
