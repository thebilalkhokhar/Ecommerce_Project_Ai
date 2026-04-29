from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RefreshTokenOut(BaseModel):
    """Metadata for a stored refresh token (omits the raw token string)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    expires_at: datetime
    is_revoked: bool
    device_info: str | None
    ip_address: str | None
