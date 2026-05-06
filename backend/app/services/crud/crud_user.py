from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

_GOOGLE_OAUTH_PLACEHOLDER_PHONE = "+923001000100"


def get_user_by_email(db: Session, email: str) -> User | None:
    normalized = email.strip().lower()
    return db.scalar(select(User).where(User.email == normalized))


def create_google_user(
    db: Session,
    *,
    email: str,
    full_name: str,
    password: str,
) -> User:
    """Register user from Google without UserCreate (skips form phone validation)."""
    user = User(
        email=email.strip().lower(),
        hashed_password=get_password_hash(password),
        full_name=full_name.strip() or "User",
        phone_number=_GOOGLE_OAUTH_PLACEHOLDER_PHONE,
        address_line_1="—",
        address_line_2=None,
        city="—",
        state="—",
        postal_code="00000",
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


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


def list_customer_users(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 200,
) -> list[User]:
    stmt = (
        select(User)
        .where(User.is_admin.is_(False))
        .order_by(User.id.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


def update_profile(db: Session, user: User, body: UserUpdate) -> User:
    """Apply partial profile fields from UserUpdate and persist."""
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
