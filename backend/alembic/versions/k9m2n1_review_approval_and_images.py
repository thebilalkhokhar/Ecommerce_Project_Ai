"""review is_approved and image_urls

Revision ID: k9m2n1review
Revises: c8f3a1b2d4e5
Create Date: 2026-05-06

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "k9m2n1review"
down_revision: Union[str, Sequence[str], None] = "c8f3a1b2d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "review",
        sa.Column(
            "is_approved",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "review",
        sa.Column(
            "image_urls",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'::json"),
        ),
    )
    op.execute(sa.text("UPDATE review SET is_approved = true"))
    op.alter_column("review", "is_approved", server_default=None)
    op.alter_column("review", "image_urls", server_default=None)


def downgrade() -> None:
    op.drop_column("review", "image_urls")
    op.drop_column("review", "is_approved")
