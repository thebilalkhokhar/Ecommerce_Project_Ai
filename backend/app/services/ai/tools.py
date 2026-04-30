from langchain_core.tools import tool

from app.db.session import SessionLocal
from app.models.order import Order
from app.services.crud import crud_product
from app.vector_store.faiss_manager import get_faiss_manager


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
def check_order_status(order_id: int) -> str:
    """Fetches the current status of a customer's order using their Order ID."""
    db = SessionLocal()
    try:
        order = db.get(Order, order_id)
        if order is None:
            return f"Order #{order_id} not found. Please check the order number."
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
    finally:
        db.close()
