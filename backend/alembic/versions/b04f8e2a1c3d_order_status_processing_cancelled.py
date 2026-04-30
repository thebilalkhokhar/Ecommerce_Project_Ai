"""order status: processing + cancelled; migrate confirmed -> processing

Revision ID: b04f8e2a1c3d
Revises: ef39ef751e5f
Create Date: 2026-04-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b04f8e2a1c3d"
down_revision: Union[str, Sequence[str], None] = "ef39ef751e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Original Enum used VARCHAR(9); "processing" is 10 chars.
    op.alter_column(
        "order",
        "status",
        existing_type=sa.String(length=9),
        type_=sa.String(length=32),
        existing_nullable=False,
        nullable=False,
    )
    op.execute(
        sa.text("UPDATE \"order\" SET status = 'processing' WHERE status = 'confirmed'"),
    )


def downgrade() -> None:
    op.execute(
        sa.text("UPDATE \"order\" SET status = 'confirmed' WHERE status = 'processing'"),
    )
    op.alter_column(
        "order",
        "status",
        existing_type=sa.String(length=32),
        type_=sa.String(length=9),
        existing_nullable=False,
        nullable=False,
    )
