from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.product import Product
from app.schemas.product import ProductCreate


def get_products(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    category_id: int | None = None,
) -> list[Product]:
    stmt = select(Product).options(selectinload(Product.category))

    if search is not None and search.strip():
        stmt = stmt.where(Product.name.ilike(f"%{search.strip()}%"))
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)

    stmt = stmt.order_by(Product.id.asc()).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


def get_product_by_id(db: Session, product_id: int) -> Product | None:
    stmt = (
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == product_id)
    )
    return db.scalars(stmt).first()


def create_product(db: Session, product_in: ProductCreate) -> Product:
    product = Product(
        name=product_in.name,
        description=product_in.description,
        price=product_in.price,
        stock_quantity=product_in.stock_quantity,
        category_id=product_in.category_id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    stmt = (
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == product.id)
    )
    return db.scalars(stmt).one()
