"""add ml y decisiones en catalogos

Revision ID: 45db9e1d09bd
Revises: 8aad80fceaa7
Create Date: 2026-05-05 18:55:55.635605
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '45db9e1d09bd'
down_revision: Union[str, Sequence[str], None] = '8aad80fceaa7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('escenarios_simulacion',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=30), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )

    op.create_table('estados_valvula',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=30), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )

    op.create_table('modelos_ml',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=100), nullable=False),
    sa.Column('tipo_modelo', sa.String(length=50), nullable=False),
    sa.Column('version', sa.String(length=50), nullable=False),
    sa.Column('objetivo', sa.String(length=100), nullable=False),
    sa.Column('framework', sa.String(length=50), nullable=True),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.Column('ruta_artefacto', sa.Text(), nullable=True),
    sa.Column('activo', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('creado_en', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre', 'version', name='uq_modelos_ml')
    )

    op.create_table('modos_riego',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=30), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )

    op.create_table('niveles_riesgo',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=30), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )

    op.create_table('origenes_decision',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=30), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )

    op.create_table('predicciones_ml',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('modelo_ml_id', sa.Integer(), nullable=False),
    sa.Column('fuente_agua_id', sa.Integer(), nullable=False),
    sa.Column('fecha_prediccion', sa.Date(), nullable=False),
    sa.Column('fecha_objetivo', sa.Date(), nullable=False),
    sa.Column('volumen_predicho_l', sa.Numeric(precision=14, scale=4), nullable=False),
    sa.Column('margen_error', sa.Numeric(precision=10, scale=4), nullable=True),
    sa.Column('confianza_modelo', sa.Numeric(precision=5, scale=2), nullable=True),
    sa.Column('resumen_entrada_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('generado_en', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['fuente_agua_id'], ['fuentes_agua.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['modelo_ml_id'], ['modelos_ml.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('modelo_ml_id', 'fuente_agua_id', 'fecha_objetivo', name='uq_predicciones_ml')
    )

    op.create_table('simulaciones_ml',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('modelo_ml_id', sa.Integer(), nullable=False),
    sa.Column('invernadero_id', sa.Integer(), nullable=False),
    sa.Column('fecha_generacion', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('horizonte_horas', sa.Integer(), nullable=False),
    sa.Column('escenario_simulacion_id', sa.Integer(), nullable=False),
    sa.Column('nivel_riesgo_id', sa.Integer(), nullable=False),
    sa.Column('descripcion_resultado', sa.Text(), nullable=True),
    sa.Column('recomendacion', sa.Text(), nullable=True),
    sa.Column('generado_en', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('horizonte_horas > 0', name='chk_simulaciones_ml_horizonte'),
    sa.ForeignKeyConstraint(['escenario_simulacion_id'], ['escenarios_simulacion.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['invernadero_id'], ['invernaderos.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['modelo_ml_id'], ['modelos_ml.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['nivel_riesgo_id'], ['niveles_riesgo.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_index(
        'idx_predicciones_ml_fuente_fecha',
        'predicciones_ml',
        ['fuente_agua_id', sa.text('fecha_objetivo DESC')],
        unique=False
    )

    op.create_index(
        'idx_simulaciones_ml_invernadero_fecha',
        'simulaciones_ml',
        ['invernadero_id', sa.text('fecha_generacion DESC')],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('idx_simulaciones_ml_invernadero_fecha', table_name='simulaciones_ml')
    op.drop_index('idx_predicciones_ml_fuente_fecha', table_name='predicciones_ml')
    op.drop_table('simulaciones_ml')
    op.drop_table('predicciones_ml')
    op.drop_table('origenes_decision')
    op.drop_table('niveles_riesgo')
    op.drop_table('modos_riego')
    op.drop_table('modelos_ml')
    op.drop_table('estados_valvula')
    op.drop_table('escenarios_simulacion')