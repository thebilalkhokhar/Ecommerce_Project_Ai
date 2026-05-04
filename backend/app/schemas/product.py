from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.category import CategoryOut


class ProductVariantCreate(BaseModel):
    name: str
    price_adjustment: float = 0
    stock_quantity: int = 0


class ProductVariantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    name: str
    price_adjustment: float = 0
    stock_quantity: int = 0


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    stock_quantity: int = 0
    category_id: int | None = None
    image_url: str | None = None
    variants: list[ProductVariantCreate] | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    stock_quantity: int | None = None
    category_id: int | None = None
    image_url: str | None = None
    variants: list[ProductVariantCreate] | None = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    price: Decimal
    stock_quantity: int
    average_rating: Decimal = Decimal("0.00")
    total_reviews: int = 0
    image_url: str | None = None
    category: CategoryOut | None = None
    variants: list[ProductVariantOut] = Field(default_factory=list)
