from langchain_core.tools import tool
from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.models.order import Order
from app.models.user import User
from app.services.ai.chat_context import chat_authenticated_user_id
from app.services.crud import crud_product
from app.vector_store.faiss_manager import get_faiss_manager

MSG_AUTH_NOT_IN_ACCOUNT = "I could not find an order with this ID in your account."
MSG_GUEST_COMBO_NOT_FOUND = (
    "No order found with this combination of Order ID and Email."
)
MSG_GUEST_NEED_EMAIL = (
    "To look up a guest order, I need both the order number and the email address "
    "used when the order was placed. Please share both."
)


def _format_order_reply(order_id: int, order: Order) -> str:
    created = order.created_at
    if created is not None:
        created_str = created.isoformat(timespec="minutes")
    else:
        created_str = "an unknown date"
    status_val = (
        order.status.value
        if hasattr(order.status, "value")
        else str(order.status)
    )
    return (
        f"Order #{order_id} was placed on {created_str} "
        f"and its current status is: {status_val}."
    )


@tool
def search_store_inventory(query: str) -> str:
    """Search the store catalog by meaning (FAISS) and return live name, price, and stock for top matches."""
    faiss_manager = get_faiss_manager()
    hits = faiss_manager.search_similar(query, top_k=3)
    if not hits:
        return "No matching products found."

    lines: list[str] = []
    seen: set[int] = set()
    db = SessionLocal()
    try:
        for product_id, _distance in hits:
            if product_id in seen:
                continue
            seen.add(product_id)
            product = crud_product.get_product_by_id(db, product_id)
            if product is None:
                continue
            lines.append(
                f"Product: {product.name}, Price: {product.price}, Stock: {product.stock_quantity}",
            )
    finally:
        db.close()

    if not lines:
        return "No matching products found in the database for those search results."
    return "\n".join(lines)


@tool
def check_order_status(order_id: int, customer_email: str | None = None) -> str:
    """Look up order status by order ID.

    Logged-in shoppers: only `order_id` is needed; the account is taken from the session.

    Guests (not logged in): you MUST have both `order_id` and `customer_email` (the email on
    the account that placed the order) before calling; never call with only `order_id` for a guest.
    """
    db = SessionLocal()
    try:
        uid = chat_authenticated_user_id.get()
        if uid is not None:
            order = db.scalar(
                select(Order).where(Order.id == order_id, Order.user_id == uid),
            )
            if order is None:
                return MSG_AUTH_NOT_IN_ACCOUNT
            return _format_order_reply(order_id, order)

        if not customer_email or not str(customer_email).strip():
            return MSG_GUEST_NEED_EMAIL

        email_norm = str(customer_email).strip().lower()
        order = db.scalar(
            select(Order)
            .join(User, Order.user_id == User.id)
            .where(
                Order.id == order_id,
                func.lower(User.email) == email_norm,
            ),
        )
        if order is None:
            return MSG_GUEST_COMBO_NOT_FOUND
        return _format_order_reply(order_id, order)
    finally:
        db.close()
