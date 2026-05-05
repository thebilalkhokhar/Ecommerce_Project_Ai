"""add order payment_status for Stripe

Revision ID: c8f3a1b2d4e5
Revises: 76bea019f3d0
Create Date: 2026-04-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c8f3a1b2d4e5"
down_revision: Union[str, Sequence[str], None] = "76bea019f3d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "order",
        sa.Column(
            "payment_status",
            sa.String(length=16),
            nullable=False,
            server_default="unpaid",
        ),
    )
    op.alter_column("order", "payment_status", server_default=None)


def downgrade() -> None:
    op.drop_column("order", "payment_status")
