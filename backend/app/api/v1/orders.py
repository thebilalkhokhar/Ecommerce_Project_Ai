from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_current_user, get_db
from app.models.user import User
from app.schemas.order import OrderCreate, OrderOut, OrderStatusUpdate
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


@router.get("/all", response_model=list[OrderOut])
def admin_list_all_orders(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> list[OrderOut]:
    orders = crud_order.get_all_orders(db, skip=skip, limit=limit)
    return [OrderOut.model_validate(o) for o in orders]


@router.patch("/{order_id}/status", response_model=OrderOut)
def admin_update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
) -> OrderOut:
    order = crud_order.update_order_status(db, order_id, body.status)
    return OrderOut.model_validate(order)
