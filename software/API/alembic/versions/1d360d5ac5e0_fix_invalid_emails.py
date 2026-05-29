"""fix_invalid_emails

Revision ID: 1d360d5ac5e0
Revises: e608a0860c6c
Create Date: 2026-05-07 20:01:41.015879

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1d360d5ac5e0'
down_revision: Union[str, Sequence[str], None] = 'e608a0860c6c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Corregir emails existentes que no tengan un punto en el dominio o no sigan formato email
    op.execute("""
        UPDATE users 
        SET email = CONCAT(username, '@gmail.com')
        WHERE email NOT LIKE '%.%' OR email NOT LIKE '%@%.%' OR email IS NULL;
    """)
    # 2. Corregir específicamente el usuario 'invitado_mcp' (aunque el UPDATE anterior ya lo haría)
    op.execute("""
        UPDATE users SET email = 'mcp@gmail.com' WHERE username = 'invitado_mcp';
    """)
    # 3. Opcional: asegurar que todos los emails tengan extensión válida (com)
    op.execute("""
        UPDATE users SET email = CONCAT(username, '@gmail.com')
        WHERE email NOT LIKE '%@gmail.com' AND email NOT LIKE '%@%.%';
    """)

def downgrade() -> None:
    pass