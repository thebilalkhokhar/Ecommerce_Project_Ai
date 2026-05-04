from fastapi import APIRouter, Depends, HTTPException, Query, status
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
    return crud_order.serialize_order_out(order)


@router.get("", response_model=list[OrderOut])
def list_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[OrderOut]:
    orders = crud_order.get_user_orders(db, current_user.id)
    return [crud_order.serialize_order_out(o) for o in orders]


@router.get("/all", response_model=list[OrderOut])
def admin_list_all_orders(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> list[OrderOut]:
    orders = crud_order.get_all_orders(db, skip=skip, limit=limit)
    return [crud_order.serialize_order_out(o) for o in orders]


@router.get("/{order_id}", response_model=OrderOut)
def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderOut:
    order = crud_order.get_order_by_id(db, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    if order.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this order",
        )
    return crud_order.serialize_order_out(order)


@router.patch("/{order_id}/status", response_model=OrderOut)
def admin_update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
) -> OrderOut:
    order = crud_order.update_order_status(db, order_id, body.status)
    return crud_order.serialize_order_out(order)
