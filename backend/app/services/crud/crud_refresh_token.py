from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.refresh_token import RefreshToken


def create_refresh_token_record(
    db: Session,
    *,
    user_id: int,
    token: str,
    device_info: str | None = None,
    ip_address: str | None = None,
) -> RefreshToken:
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS,
    )
    row = RefreshToken(
        token=token,
        user_id=user_id,
        expires_at=expires_at,
        is_revoked=False,
        device_info=device_info,
        ip_address=ip_address,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_refresh_token_by_token(db: Session, token: str) -> RefreshToken | None:
    return db.scalar(select(RefreshToken).where(RefreshToken.token == token))


def revoke_all_for_user(db: Session, user_id: int) -> None:
    rows = db.scalars(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked.is_(False),
        ),
    ).all()
    for row in rows:
        row.is_revoked = True
        db.add(row)
    if rows:
        db.commit()
