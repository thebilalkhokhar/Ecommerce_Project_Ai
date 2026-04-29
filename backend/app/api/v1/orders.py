from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.order import OrderCreate, OrderOut
from app.services.crud import crud_order

router = APIRouter()


@router.post(
    "",
    response_model=OrderOut,
    status_code=status.HTTP_201_CREATED,
)
def checkout(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderOut:
    order = crud_order.create_order(db, current_user, order_in)
    return OrderOut.model_validate(order)


@router.get("", response_model=list[OrderOut])
def list_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[OrderOut]:
    orders = crud_order.get_user_orders(db, current_user.id)
    return [OrderOut.model_validate(o) for o in orders]
