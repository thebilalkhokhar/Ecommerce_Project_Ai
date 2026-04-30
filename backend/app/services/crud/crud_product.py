from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


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
        image_url=product_in.image_url,
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


def update_product(
    db: Session,
    product_id: int,
    product_in: ProductUpdate,
) -> Product | None:
    product = db.get(Product, product_id)
    if product is None:
        return None
    for key, value in product_in.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    db.add(product)
    db.commit()
    stmt = (
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == product_id)
    )
    return db.scalars(stmt).one()


def delete_product(db: Session, product_id: int) -> None:
    product = db.get(Product, product_id)
    if product is None:
        raise ValueError("not_found")
    try:
        db.delete(product)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("in_use") from None
    product = db.get(Product, product_id)
    if product is None:
        return None
    product.image_url = image_url
    db.add(product)
    db.commit()
    stmt = (
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == product_id)
    )
    return db.scalars(stmt).one()
