"""add tablas de riego

Revision ID: faa03476ee88
Revises: 45db9e1d09bd
Create Date: 2026-05-05 18:59:13.025675
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'faa03476ee88'
down_revision: Union[str, Sequence[str], None] = '45db9e1d09bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('decisiones_riego',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('origen_decision_id', sa.Integer(), nullable=False),
    sa.Column('modo_riego_id', sa.Integer(), nullable=False),
    sa.Column('estado_valvula_id', sa.Integer(), nullable=False),
    sa.Column('texto_decision', sa.Text(), nullable=True),
    sa.Column('ejecutado_en', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['estado_valvula_id'], ['estados_valvula.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['modo_riego_id'], ['modos_riego.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['origen_decision_id'], ['origenes_decision.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('eventos_riego',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('decision_riego_id', sa.Integer(), nullable=False),
    sa.Column('inicio_evento', sa.DateTime(timezone=True), nullable=False),
    sa.Column('fin_evento', sa.DateTime(timezone=True), nullable=True),
    sa.Column('duracion_segundos', sa.Integer(), nullable=True),
    sa.Column('observaciones', sa.Text(), nullable=True),
    sa.CheckConstraint('duracion_segundos IS NULL OR duracion_segundos >= 0', name='chk_eventos_riego_duracion'),
    sa.CheckConstraint('fin_evento IS NULL OR fin_evento >= inicio_evento', name='chk_eventos_riego_fechas'),
    sa.ForeignKeyConstraint(['decision_riego_id'], ['decisiones_riego.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('metricas_decision_riego',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('decision_riego_id', sa.Integer(), nullable=False),
    sa.Column('volumen_disponible_l', sa.Numeric(precision=14, scale=4), nullable=True),
    sa.Column('demanda_estimada_l', sa.Numeric(precision=14, scale=4), nullable=True),
    sa.Column('volumen_aplicado_l', sa.Numeric(precision=14, scale=4), nullable=True),
    sa.CheckConstraint(
        '(volumen_disponible_l IS NULL OR volumen_disponible_l >= 0) AND '
        '(demanda_estimada_l IS NULL OR demanda_estimada_l >= 0) AND '
        '(volumen_aplicado_l IS NULL OR volumen_aplicado_l >= 0)',
        name='chk_metricas_decision_riego_valores'
    ),
    sa.ForeignKeyConstraint(['decision_riego_id'], ['decisiones_riego.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('decision_riego_id')
    )

    op.create_table('decisiones_riego_actuadores',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('decision_riego_id', sa.Integer(), nullable=False),
    sa.Column('actuador_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['actuador_id'], ['actuadores.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['decision_riego_id'], ['decisiones_riego.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('decision_riego_id', 'actuador_id', name='uq_decisiones_riego_actuadores')
    )

    op.create_table('decisiones_riego_fuentes_agua',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('decision_riego_id', sa.Integer(), nullable=False),
    sa.Column('fuente_agua_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['decision_riego_id'], ['decisiones_riego.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['fuente_agua_id'], ['fuentes_agua.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('decision_riego_id', 'fuente_agua_id', name='uq_decisiones_riego_fuentes_agua')
    )

    op.create_table('decisiones_riego_invernaderos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('decision_riego_id', sa.Integer(), nullable=False),
    sa.Column('invernadero_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['decision_riego_id'], ['decisiones_riego.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['invernadero_id'], ['invernaderos.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('decision_riego_id', 'invernadero_id', name='uq_decisiones_riego_invernaderos')
    )

    op.create_table('estado_riego_actual',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('invernadero_id', sa.Integer(), nullable=False),
    sa.Column('ultima_decision_id', sa.Integer(), nullable=False),
    sa.Column('actualizado_en', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['invernadero_id'], ['invernaderos.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['ultima_decision_id'], ['decisiones_riego.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('invernadero_id')
    )

    op.create_index(
        'idx_decisiones_riego_ejecutado_en',
        'decisiones_riego',
        [sa.text('ejecutado_en DESC')],
        unique=False
    )

    op.create_index(
        'idx_eventos_riego_decision_id',
        'eventos_riego',
        ['decision_riego_id'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('idx_eventos_riego_decision_id', table_name='eventos_riego')
    op.drop_index('idx_decisiones_riego_ejecutado_en', table_name='decisiones_riego')
    op.drop_table('estado_riego_actual')
    op.drop_table('decisiones_riego_invernaderos')
    op.drop_table('decisiones_riego_fuentes_agua')
    op.drop_table('decisiones_riego_actuadores')
    op.drop_table('metricas_decision_riego')
    op.drop_table('eventos_riego')
    op.drop_table('decisiones_riego')