"""relacionar_sincronizaciones_con_dispositivos

Revision ID: f4760bbf2728
Revises: afeb90d5a7cb
Create Date: 2026-05-07 14:22:55.645001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4760bbf2728'
down_revision: Union[str, Sequence[str], None] = 'afeb90d5a7cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Creamos la columna permitiendo nulos inicialmente
    op.add_column('sincronizaciones_mcp', sa.Column('dispositivo_id', sa.BigInteger(), nullable=True))
    
    # 2. Creamos la restricción de llave foránea
    op.create_foreign_key(
        'fk_sincronizaciones_mcp_dispositivo', # nombre del constraint
        'sincronizaciones_mcp',                # tabla origen
        'dispositivos',                         # tabla destino
        ['dispositivo_id'],                     # columna local
        ['id'],                                 # columna remota en dispositivos
        ondelete='SET NULL'
    )

def downgrade() -> None:
    op.drop_constraint('fk_sincronizaciones_mcp_dispositivo', 'sincronizaciones_mcp', type_='foreignkey')
    op.drop_column('sincronizaciones_mcp', 'dispositivo_id')