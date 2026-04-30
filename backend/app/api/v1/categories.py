from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_db
from app.schemas.category import CategoryCreate, CategoryOut
from app.models.user import User
from app.services.crud import crud_category

router = APIRouter()


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    categories = crud_category.get_categories(db)
    return [CategoryOut.model_validate(c) for c in categories]


@router.post(
    "",
    response_model=CategoryOut,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
) -> CategoryOut:
    category = crud_category.create_category(db, body)
    return CategoryOut.model_validate(category)
