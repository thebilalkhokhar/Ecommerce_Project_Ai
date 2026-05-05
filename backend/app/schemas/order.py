from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.order import OrderStatus, PaymentStatus


class OrderItemCreate(BaseModel):
    product_id: int = Field(..., ge=1)
    quantity: int = Field(..., ge=1)
    variant_name: str | None = None


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(..., min_length=1)
    is_cod: bool = True


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    variant_name: str | None = None
    product_name: str | None = None


class OrderUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str | None = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    total_price: Decimal
    status: OrderStatus
    payment_status: PaymentStatus
    is_cod: bool
    created_at: datetime | None = None
    user: OrderUserOut | None = None
    items: list[OrderItemOut]


class OrderStatusUpdate(BaseModel):
    """Admin-only status transition; values must match OrderStatus."""

    status: OrderStatus
