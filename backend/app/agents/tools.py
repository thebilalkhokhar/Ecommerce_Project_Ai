from langchain_core.tools import tool

from app.db.session import SessionLocal
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
