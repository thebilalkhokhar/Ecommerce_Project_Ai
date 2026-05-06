from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, model_validator


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
    is_approved: bool
    image_urls: list[str] = Field(default_factory=list)
    user: ReviewUserSnippet
    likes_count: int = 0
    dislikes_count: int = 0


class AdminReviewListOut(ReviewOut):
    product_name: str


class AdminReviewUpdate(BaseModel):
    is_approved: bool | None = None
    admin_reply: str | None = Field(None, max_length=8000)

    @model_validator(mode="after")
    def at_least_one_field(self) -> AdminReviewUpdate:
        if self.is_approved is None and self.admin_reply is None:
            raise ValueError("Provide is_approved and/or admin_reply")
        return self


class ReactionCreate(BaseModel):
    is_like: bool


class AdminReplyBody(BaseModel):
    reply: str = Field(..., min_length=1)
