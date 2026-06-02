"""add Tickets de dispositivos

Revision ID: 0bcdad9525c0
Revises: 631b01ec3fcb
Create Date: 2026-06-01 11:10:00.810808

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0bcdad9525c0'
down_revision: Union[str, Sequence[str], None] = '631b01ec3fcb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tickets_mantenimiento",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tipo_recurso", sa.Enum("dispositivo", "sensor", "actuador", name="tipo_recurso_ticket"), nullable=False),
        sa.Column("recurso_id", sa.Integer(), nullable=False),
        sa.Column("reportante_ci", sa.String(length=20), nullable=False),
        sa.Column("tecnico_ci", sa.String(length=20), nullable=True),
        sa.Column("descripcion_problema", sa.Text(), nullable=False),
        sa.Column("observacion_tecnica", sa.Text(), nullable=True),
        sa.Column("estado", sa.Enum("pendiente", "en_revision", "terminado", "cancelado", name="estado_ticket_mantenimiento"), nullable=False),
        sa.Column("resultado_revision", sa.Enum("danado", "mantenimiento", "sin_falla", name="resultado_revision_ticket"), nullable=True),
        sa.Column("fecha_reporte", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("fecha_toma", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fecha_cierre", sa.DateTime(timezone=True), nullable=True),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("actualizado_en", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["reportante_ci"], ["users.ci"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["tecnico_ci"], ["users.ci"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tickets_mantenimiento_tipo_recurso"), "tickets_mantenimiento", ["tipo_recurso"], unique=False)
    op.create_index(op.f("ix_tickets_mantenimiento_recurso_id"), "tickets_mantenimiento", ["recurso_id"], unique=False)
    op.create_index(op.f("ix_tickets_mantenimiento_reportante_ci"), "tickets_mantenimiento", ["reportante_ci"], unique=False)
    op.create_index(op.f("ix_tickets_mantenimiento_tecnico_ci"), "tickets_mantenimiento", ["tecnico_ci"], unique=False)
    op.create_index(op.f("ix_tickets_mantenimiento_estado"), "tickets_mantenimiento", ["estado"], unique=False)

    op.create_table(
        "historial_tickets_mantenimiento",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ticket_id", sa.Integer(), nullable=False),
        sa.Column("estado_anterior", sa.Enum("pendiente", "en_revision", "terminado", "cancelado", name="estado_ticket_mantenimiento_historial"), nullable=True),
        sa.Column("estado_nuevo", sa.Enum("pendiente", "en_revision", "terminado", "cancelado", name="estado_ticket_mantenimiento_historial_2"), nullable=False),
        sa.Column("actor_ci", sa.String(length=20), nullable=True),
        sa.Column("comentario", sa.Text(), nullable=True),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["ticket_id"], ["tickets_mantenimiento.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["actor_ci"], ["users.ci"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_historial_tickets_mantenimiento_ticket_id"), "historial_tickets_mantenimiento", ["ticket_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_historial_tickets_mantenimiento_ticket_id"), table_name="historial_tickets_mantenimiento")
    op.drop_table("historial_tickets_mantenimiento")
    op.drop_index(op.f("ix_tickets_mantenimiento_estado"), table_name="tickets_mantenimiento")
    op.drop_index(op.f("ix_tickets_mantenimiento_tecnico_ci"), table_name="tickets_mantenimiento")
    op.drop_index(op.f("ix_tickets_mantenimiento_reportante_ci"), table_name="tickets_mantenimiento")
    op.drop_index(op.f("ix_tickets_mantenimiento_recurso_id"), table_name="tickets_mantenimiento")
    op.drop_index(op.f("ix_tickets_mantenimiento_tipo_recurso"), table_name="tickets_mantenimiento")
    
    op.execute("DROP TYPE IF EXISTS estado_ticket_mantenimiento_historial_2")
    op.execute("DROP TYPE IF EXISTS estado_ticket_mantenimiento_historial")
    op.execute("DROP TYPE IF EXISTS resultado_revision_ticket")
    op.execute("DROP TYPE IF EXISTS estado_ticket_mantenimiento")
    op.execute("DROP TYPE IF EXISTS tipo_recurso_ticket")
    
    op.drop_table("tickets_mantenimiento")