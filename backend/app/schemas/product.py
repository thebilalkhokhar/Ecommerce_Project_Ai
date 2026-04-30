from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.category import CategoryOut


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    stock_quantity: int = 0
    category_id: int | None = None
    image_url: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    stock_quantity: int | None = None
    category_id: int | None = None
    image_url: str | None = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    price: Decimal
    stock_quantity: int
    image_url: str | None = None
    category: CategoryOut | None = None
