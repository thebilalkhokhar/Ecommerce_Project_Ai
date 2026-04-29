from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate


def get_products(db: Session, skip: int = 0, limit: int = 100) -> list[Product]:
    stmt = select(Product).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


def get_product_by_id(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)


def create_product(db: Session, product_in: ProductCreate) -> Product:
    product = Product(
        name=product_in.name,
        description=product_in.description,
        price=product_in.price,
        stock_quantity=product_in.stock_quantity,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
