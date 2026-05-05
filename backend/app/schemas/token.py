from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPayload(BaseModel):
    sub: str | None = None
    exp: int | None = None


class GoogleLoginRequest(BaseModel):
    """Google Sign-In credential (JWT) from the frontend."""

    credential: str = Field(..., min_length=20)