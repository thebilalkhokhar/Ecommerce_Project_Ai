"""One review per user per product (unique constraint).

Revision ID: m1n2o3_review_unique
Revises: k9m2n1review
Create Date: 2026-05-06

"""
from typing import Sequence, Union

from alembic import op

revision: str = "m1n2o3_review_unique"
down_revision: Union[str, Sequence[str], None] = "k9m2n1review"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DELETE FROM review AS a
        USING review AS b
        WHERE a.id > b.id
          AND a.user_id = b.user_id
          AND a.product_id = b.product_id
        """,
    )
    op.create_unique_constraint(
        "uq_review_user_product",
        "review",
        ["user_id", "product_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_review_user_product", "review", type_="unique")
