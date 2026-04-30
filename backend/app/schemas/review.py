from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1)


class ReviewUserSnippet(BaseModel):
    """Minimal author info on a review."""

    name: str


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    user_id: int
    rating: int
    comment: str
    admin_reply: str | None
    is_verified_purchase: bool
    user: ReviewUserSnippet
    likes_count: int = 0
    dislikes_count: int = 0


class ReactionCreate(BaseModel):
    is_like: bool


class AdminReplyBody(BaseModel):
    reply: str = Field(..., min_length=1)
