from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.product import Product, ProductVariant
from app.schemas.product import ProductCreate, ProductUpdate


def _product_load_options():
    return (
        selectinload(Product.category),
        selectinload(Product.variants),
    )


def get_products(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    category_id: int | None = None,
) -> list[Product]:
    stmt = select(Product).options(*_product_load_options())

    if search is not None and search.strip():
        stmt = stmt.where(Product.name.ilike(f"%{search.strip()}%"))
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)

    stmt = stmt.order_by(Product.id.asc()).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


def get_product_by_id(db: Session, product_id: int) -> Product | None:
    stmt = (
        select(Product)
        .options(*_product_load_options())
        .where(Product.id == product_id)
    )
    return db.scalars(stmt).first()


def get_related_products(
    db: Session,
    product_id: int,
    category_id: int | None,
    limit: int = 4,
) -> list[Product]:
    stmt = (
        select(Product)
        .options(*_product_load_options())
        .where(Product.id != product_id)
    )
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    stmt = stmt.order_by(Product.id.desc()).limit(limit)
    return list(db.scalars(stmt).all())


def create_product(db: Session, product_in: ProductCreate) -> Product:
    data = product_in.model_dump(exclude={"variants"})
    variants_in = product_in.variants
    product = Product(**data)
    db.add(product)
    db.flush()
    if variants_in:
        for v in variants_in:
            db.add(
                ProductVariant(
                    product_id=product.id,
                    name=v.name,
                    price_adjustment=v.price_adjustment,
                    stock_quantity=v.stock_quantity,
                )
            )
    db.commit()
    stmt = (
        select(Product)
        .options(*_product_load_options())
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
    update_data = product_in.model_dump(exclude_unset=True)
    variants_in = update_data.pop("variants", None)

    for key, value in update_data.items():
        setattr(product, key, value)

    if variants_in is not None:
        db.execute(
            delete(ProductVariant).where(ProductVariant.product_id == product_id),
        )
        db.flush()
        for row in variants_in:
            db.add(
                ProductVariant(
                    product_id=product_id,
                    name=row["name"],
                    price_adjustment=float(row["price_adjustment"]),
                    stock_quantity=int(row["stock_quantity"]),
                )
            )

    db.add(product)
    db.commit()
    stmt = (
        select(Product)
        .options(*_product_load_options())
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


def update_product_image(db: Session, product_id: int, image_url: str) -> Product | None:
    product = db.get(Product, product_id)
    if product is None:
        return None
    product.image_url = image_url
    db.add(product)
    db.commit()
    stmt = (
        select(Product)
        .options(*_product_load_options())
        .where(Product.id == product_id)
    )
    return db.scalars(stmt).one()
