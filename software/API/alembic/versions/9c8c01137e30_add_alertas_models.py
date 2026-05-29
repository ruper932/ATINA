"""add alertas models

Revision ID: 9c8c01137e30
Revises: faa03476ee88
Create Date: 2026-05-05 19:08:23.803887
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '9c8c01137e30'
down_revision: Union[str, Sequence[str], None] = 'faa03476ee88'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('estados_alerta',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=30), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )
    op.create_table('estados_envio',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=30), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )
    op.create_table('origenes_alerta',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=30), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )
    op.create_table('severidades_alerta',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=30), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )
    op.create_table('tipos_notificacion',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=30), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )
    op.create_table('alertas',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('tipo_alerta', sa.String(length=50), nullable=False),
    sa.Column('severidad_alerta_id', sa.Integer(), nullable=False),
    sa.Column('origen_alerta_id', sa.Integer(), nullable=False),
    sa.Column('mensaje', sa.Text(), nullable=False),
    sa.Column('estado_alerta_id', sa.Integer(), nullable=False),
    sa.Column('fecha_generacion', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_reconocimiento', sa.DateTime(timezone=True), nullable=True),
    # CAMBIO: usuario_reconoce_id (Integer) a usuario_reconoce_ci (String)
    sa.Column('usuario_reconoce_ci', sa.String(length=20), nullable=True),
    sa.CheckConstraint('fecha_reconocimiento IS NULL OR fecha_reconocimiento >= fecha_generacion', name='chk_alertas_reconocimiento'),
    sa.ForeignKeyConstraint(['estado_alerta_id'], ['estados_alerta.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['origen_alerta_id'], ['origenes_alerta.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['severidad_alerta_id'], ['severidades_alerta.id'], ondelete='RESTRICT'),
    # CAMBIO: Apunta a users.ci en lugar de users.id
    sa.ForeignKeyConstraint(['usuario_reconoce_ci'], ['users.ci'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_alertas_estado_alerta_id', 'alertas', ['estado_alerta_id'], unique=False)
    op.create_index('idx_alertas_fecha_generacion', 'alertas', [sa.text('fecha_generacion DESC')], unique=False)
    op.create_table('alertas_decisiones_riego',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('alerta_id', sa.Integer(), nullable=False),
    sa.Column('decision_riego_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['alerta_id'], ['alertas.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['decision_riego_id'], ['decisiones_riego.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('alerta_id', 'decision_riego_id', name='uq_alertas_decisiones_riego')
    )
    op.create_table('alertas_dispositivos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('alerta_id', sa.Integer(), nullable=False),
    sa.Column('dispositivo_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['alerta_id'], ['alertas.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['dispositivo_id'], ['dispositivos.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('alerta_id', 'dispositivo_id', name='uq_alertas_dispositivos')
    )
    op.create_table('notificaciones_locales',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('alerta_id', sa.Integer(), nullable=False),
    sa.Column('tipo_notificacion_id', sa.Integer(), nullable=False),
    sa.Column('estado_envio_id', sa.Integer(), nullable=False),
    sa.Column('fecha_envio', sa.DateTime(timezone=True), nullable=True),
    sa.Column('fecha_confirmacion', sa.DateTime(timezone=True), nullable=True),
    sa.Column('detalle_respuesta', sa.Text(), nullable=True),
    sa.CheckConstraint('fecha_confirmacion IS NULL OR fecha_envio IS NULL OR fecha_confirmacion >= fecha_envio', name='chk_notificaciones_locales_fechas'),
    sa.ForeignKeyConstraint(['alerta_id'], ['alertas.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['estado_envio_id'], ['estados_envio.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['tipo_notificacion_id'], ['tipos_notificacion.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('alertas_invernaderos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('alerta_id', sa.Integer(), nullable=False),
    sa.Column('invernadero_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['alerta_id'], ['alertas.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['invernadero_id'], ['invernaderos.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('alerta_id', 'invernadero_id', name='uq_alertas_invernaderos')
    )
    op.create_table('alertas_sensores',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('alerta_id', sa.Integer(), nullable=False),
    sa.Column('sensor_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['alerta_id'], ['alertas.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['sensor_id'], ['sensores.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('alerta_id', 'sensor_id', name='uq_alertas_sensores')
    )
    op.create_table('alertas_simulaciones_ml',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('alerta_id', sa.Integer(), nullable=False),
    sa.Column('simulacion_ml_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['alerta_id'], ['alertas.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['simulacion_ml_id'], ['simulaciones_ml.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('alerta_id', 'simulacion_ml_id', name='uq_alertas_simulaciones_ml')
    )


def downgrade() -> None:
    op.drop_index('idx_alertas_fecha_generacion', table_name='alertas')
    op.drop_index('idx_alertas_estado_alerta_id', table_name='alertas')
    op.drop_table('alertas_simulaciones_ml')
    op.drop_table('alertas_sensores')
    op.drop_table('alertas_invernaderos')
    op.drop_table('notificaciones_locales')
    op.drop_table('alertas_dispositivos')
    op.drop_table('alertas_decisiones_riego')
    op.drop_table('alertas')
    op.drop_table('tipos_notificacion')
    op.drop_table('severidades_alerta')
    op.drop_table('origenes_alerta')
    op.drop_table('estados_envio')
    op.drop_table('estados_alerta')