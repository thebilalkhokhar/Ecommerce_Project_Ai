"""Import all models so Alembic autogenerate can resolve metadata."""

from app.db.base_class import Base
from app.models.category import Category
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.refresh_token import RefreshToken
from app.models.review import Review, ReviewReaction
from app.models.user import User
from app.models.wishlist import Wishlist

__all__ = [
    "Base",
    "Category",
    "Order",
    "OrderItem",
    "Product",
    "RefreshToken",
    "Review",
    "ReviewReaction",
    "User",
    "Wishlist",
]
