"""update_test_passwords

Revision ID: 7f5238c8c80f
Revises: 1d360d5ac5e0
Create Date: 2026-05-15 17:59:52.945359

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7f5238c8c80f'
down_revision: Union[str, Sequence[str], None] = '1d360d5ac5e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
    op.execute("""
        UPDATE users
        SET hashed_password = crypt('demons312es', gen_salt('bf'))
        WHERE ci = '1234567' AND hashed_password = 'fake_hash_para_pruebas';
    """)
    op.execute("""
        UPDATE users
        SET hashed_password = crypt('demons312es', gen_salt('bf'))
        WHERE ci = '7654321' AND hashed_password = 'fake_hash_para_pruebas';
    """)

def downgrade() -> None:
    """Downgrade schema."""
    pass
