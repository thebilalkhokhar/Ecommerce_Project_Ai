from pydantic import BaseModel, ConfigDict

from app.schemas.product import ProductOut


class WishlistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    product: ProductOut
