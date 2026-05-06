from fastapi import APIRouter, Depends, Query

from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_current_user, get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate
from app.services.crud import crud_user

router = APIRouter()


@router.get("/me", response_model=UserOut)
def read_me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)


@router.get("/all", response_model=list[UserOut])
def admin_list_customer_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
) -> list[UserOut]:
    rows = crud_user.list_customer_users(db, skip=skip, limit=limit)
    return [UserOut.model_validate(u) for u in rows]


@router.patch("/me", response_model=UserOut)
def update_me(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserOut:
    user = crud_user.update_profile(db, current_user, body)
    return UserOut.model_validate(user)
