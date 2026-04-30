from fastapi import APIRouter

from app.api.v1 import auth, categories, chatbot, orders, products, reviews, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(reviews.router, tags=["Reviews"])
api_router.include_router(chatbot.router, prefix="/bot", tags=["Chatbot"])
