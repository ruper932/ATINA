"""fix test password hashes using python bcrypt

Revision ID: 8913ad18d578
Revises: 7f5238c8c80f
Create Date: 2026-05-17 20:23:59.433761

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.core.security import get_password_hash


# revision identifiers, used by Alembic.
revision: str = '8913ad18d578'
down_revision: Union[str, Sequence[str], None] = '7f5238c8c80f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TEST_PASSWORD = "holamundo"


def upgrade() -> None:
    connection = op.get_bind()
    hashed_password = get_password_hash(TEST_PASSWORD)

    connection.execute(
        sa.text("""
            UPDATE users
            SET hashed_password = :hashed_password
            WHERE ci = :ci
        """),
        {
            "hashed_password": hashed_password,
            "ci": "1234567",
        },
    )

    connection.execute(
        sa.text("""
            UPDATE users
            SET hashed_password = :hashed_password
            WHERE ci = :ci
        """),
        {
            "hashed_password": hashed_password,
            "ci": "7654321",
        },
    )


def downgrade() -> None:
    pass