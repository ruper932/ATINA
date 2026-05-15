"""add reportes y sinc mcp

Revision ID: 99aa4214f755
Revises: a488f28379eb
Create Date: 2026-05-05 19:22:48.872675
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '99aa4214f755'
down_revision: Union[str, Sequence[str], None] = 'a488f28379eb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'estados_sincronizacion',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=30), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nombre')
    )

    op.create_table(
        'reportes_semanales',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('periodo_inicio', sa.Date(), nullable=False),
        sa.Column('periodo_fin', sa.Date(), nullable=False),
        sa.Column('volumen_captado_l', sa.Numeric(precision=14, scale=4), server_default=sa.text('0'), nullable=False),
        sa.Column('volumen_predicho_l', sa.Numeric(precision=14, scale=4), server_default=sa.text('0'), nullable=False),
        sa.Column('eficiencia_riego', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column('total_alertas', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('resumen', sa.Text(), nullable=True),
        # CAMBIO: generado_por (Integer) a generado_por_ci (String)
        sa.Column('generado_por_ci', sa.String(length=20), nullable=True),
        sa.Column('fecha_generacion', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('periodo_fin >= periodo_inicio', name='chk_reportes_semanales_periodo'),
        sa.CheckConstraint('volumen_captado_l >= 0 AND volumen_predicho_l >= 0 AND total_alertas >= 0', name='chk_reportes_semanales_valores'),
        # CAMBIO: Se actualiza ForeignKey para apuntar a users.ci
        sa.ForeignKeyConstraint(['generado_por_ci'], ['users.ci'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'sincronizaciones_mcp',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('estado_sincronizacion_id', sa.Integer(), nullable=False),
        sa.Column('origen', sa.String(length=50), nullable=False),
        sa.Column('destino', sa.String(length=50), nullable=False),
        sa.Column('tipo_recurso', sa.String(length=50), nullable=False),
        sa.Column('cantidad_registros', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('fecha_inicio', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('fecha_fin', sa.DateTime(timezone=True), nullable=True),
        sa.Column('mensaje_resultado', sa.Text(), nullable=True),
        sa.CheckConstraint('cantidad_registros >= 0', name='chk_sincronizaciones_mcp_registros'),
        sa.CheckConstraint('fecha_fin IS NULL OR fecha_fin >= fecha_inicio', name='chk_sincronizaciones_mcp_fechas'),
        sa.ForeignKeyConstraint(['estado_sincronizacion_id'], ['estados_sincronizacion.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('sincronizaciones_mcp')
    op.drop_table('reportes_semanales')
    op.drop_table('estados_sincronizacion')