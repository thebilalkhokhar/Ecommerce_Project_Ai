from fastapi import APIRouter

from app.api.v1 import (
    admin_reviews,
    analytics,
    auth,
    categories,
    chatbot,
    orders,
    payments,
    products,
    reviews,
    users,
    wishlist,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(reviews.router, tags=["Reviews"])
api_router.include_router(admin_reviews.router, prefix="/admin", tags=["Admin"])
api_router.include_router(chatbot.router, prefix="/bot", tags=["Chatbot"])
api_router.include_router(wishlist.router, prefix="/wishlist", tags=["Wishlist"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
