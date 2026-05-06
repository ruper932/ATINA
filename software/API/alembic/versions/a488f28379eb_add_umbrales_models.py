"""add umbrales models

Revision ID: a488f28379eb
Revises: 9c8c01137e30
Create Date: 2026-05-05 19:17:29.237050
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a488f28379eb'
down_revision: Union[str, Sequence[str], None] = '9c8c01137e30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('ambitos_umbral',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=30), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )
    op.create_table('parametros_umbral',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=100), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.Column('unidad', sa.String(length=30), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )
    op.create_table('configuraciones_umbral',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('parametro_umbral_id', sa.Integer(), nullable=False),
    sa.Column('valor', sa.Numeric(precision=14, scale=4), nullable=False),
    sa.Column('ambito_umbral_id', sa.Integer(), nullable=False),
    sa.Column('editable', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('actualizado_por', sa.Integer(), nullable=True),
    sa.Column('actualizado_en', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['actualizado_por'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['ambito_umbral_id'], ['ambitos_umbral.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['parametro_umbral_id'], ['parametros_umbral.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('configuraciones_umbral_invernaderos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('configuracion_umbral_id', sa.Integer(), nullable=False),
    sa.Column('invernadero_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['configuracion_umbral_id'], ['configuraciones_umbral.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['invernadero_id'], ['invernaderos.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('configuracion_umbral_id', 'invernadero_id', name='uq_configuraciones_umbral_invernaderos')
    )
    op.create_table('configuraciones_umbral_sensores',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('configuracion_umbral_id', sa.Integer(), nullable=False),
    sa.Column('sensor_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['configuracion_umbral_id'], ['configuraciones_umbral.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['sensor_id'], ['sensores.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('configuracion_umbral_id', 'sensor_id', name='uq_configuraciones_umbral_sensores')
    )

def downgrade() -> None:
    op.drop_table('configuraciones_umbral_sensores')
    op.drop_table('configuraciones_umbral_invernaderos')
    op.drop_table('configuraciones_umbral')
    op.drop_table('parametros_umbral')
    op.drop_table('ambitos_umbral')