"""add order.created_at

Revision ID: f7a91b2c3d4e
Revises: cda2b39dd99f
Create Date: 2026-04-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f7a91b2c3d4e"
down_revision: Union[str, Sequence[str], None] = "cda2b39dd99f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "order",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("order", "created_at")
