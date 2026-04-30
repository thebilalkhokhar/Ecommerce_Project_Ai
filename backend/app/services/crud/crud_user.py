from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate


def get_user_by_email(db: Session, email: str) -> User | None:
    normalized = email.strip().lower()
    return db.scalar(select(User).where(User.email == normalized))


def create_user(db: Session, user_in: UserCreate) -> User:
    user = User(
        email=str(user_in.email).strip().lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        address_line_1=user_in.address_line_1,
        address_line_2=user_in.address_line_2,
        city=user_in.city,
        state=user_in.state,
        postal_code=user_in.postal_code,
        is_admin=False,  # Self-registration never grants admin; set via DB/migration
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
