from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.category import Category
from app.schemas.category import CategoryCreate


def get_categories(db: Session) -> list[Category]:
    stmt = select(Category).order_by(Category.name.asc())
    return list(db.scalars(stmt).all())


def create_category(db: Session, category_in: CategoryCreate) -> Category:
    category = Category(
        name=category_in.name.strip(),
        description=(
            (category_in.description.strip() or None)
            if category_in.description is not None
            else None
        ),
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
