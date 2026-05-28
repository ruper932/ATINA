"""add solicitudes movimiento

Revision ID: 631b01ec3fcb
Revises: 3099b8b58fec
Create Date: 2026-05-27 16:31:00.715962

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '631b01ec3fcb'
down_revision: Union[str, Sequence[str], None] = '3099b8b58fec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

tipo_recurso_enum = postgresql.ENUM(
    "atrapaniebla",
    "fuenteagua",
    name="tipo_recurso_solicitud_enum",
    create_type=False,
)

estado_solicitud_enum = postgresql.ENUM(
    "pendiente",
    "en_revision",
    "aprobada",
    "rechazada",
    "cancelada",
    name="estado_solicitud_enum",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()

    tipo_recurso_enum.create(bind, checkfirst=True)
    estado_solicitud_enum.create(bind, checkfirst=True)

    op.create_table(
        "solicitudes_movimiento",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tipo_recurso", tipo_recurso_enum, nullable=False),
        sa.Column("recurso_id", sa.Integer(), nullable=False),
        sa.Column("solicitante_ci", sa.String(length=20), nullable=False),
        sa.Column("revisor_ci", sa.String(length=20), nullable=True),
        sa.Column("ubicacion_origen_id", sa.Integer(), nullable=False),
        sa.Column("ubicacion_destino_id", sa.Integer(), nullable=True),
        sa.Column("ubicacion_destino_propuesta", sa.Text(), nullable=True),
        sa.Column("motivo", sa.Text(), nullable=False),
        sa.Column("observacion", sa.Text(), nullable=True),
        sa.Column("pdf_url", sa.String(length=500), nullable=True),
        sa.Column(
            "estado",
            estado_solicitud_enum,
            nullable=False,
            server_default=sa.text("'pendiente'"),
        ),
        sa.Column(
            "fecha_creacion",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("fecha_revision", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fecha_resolucion", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "actualizado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["solicitante_ci"],
            ["users.ci"],
            name="fk_solicitudes_movimiento_solicitante_ci_users",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["revisor_ci"],
            ["users.ci"],
            name="fk_solicitudes_movimiento_revisor_ci_users",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["ubicacion_origen_id"],
            ["ubicaciones.id"],
            name="fk_solicitudes_movimiento_ubicacion_origen",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["ubicacion_destino_id"],
            ["ubicaciones.id"],
            name="fk_solicitudes_movimiento_ubicacion_destino",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_solicitudes_movimiento"),
        sa.CheckConstraint(
            "ubicacion_origen_id <> ubicacion_destino_id",
            name="chk_solicitudes_movimiento_origen_destino_distintos",
        ),
        sa.CheckConstraint(
            "(ubicacion_destino_id IS NOT NULL) OR (ubicacion_destino_propuesta IS NOT NULL AND btrim(ubicacion_destino_propuesta) <> '')",
            name="chk_solicitudes_movimiento_destino_requerido",
        ),
        sa.CheckConstraint(
            "btrim(motivo) <> ''",
            name="chk_solicitudes_movimiento_motivo_no_vacio",
        ),
    )

    op.create_index(
        "ix_solicitudes_movimiento_id",
        "solicitudes_movimiento",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_solicitudes_movimiento_estado",
        "solicitudes_movimiento",
        ["estado"],
        unique=False,
    )
    op.create_index(
        "ix_solicitudes_movimiento_solicitante_ci",
        "solicitudes_movimiento",
        ["solicitante_ci"],
        unique=False,
    )
    op.create_index(
        "ix_solicitudes_movimiento_revisor_ci",
        "solicitudes_movimiento",
        ["revisor_ci"],
        unique=False,
    )
    op.create_index(
        "ix_solicitudes_movimiento_tipo_recurso_recurso_id",
        "solicitudes_movimiento",
        ["tipo_recurso", "recurso_id"],
        unique=False,
    )

    op.create_table(
        "historial_solicitudes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("solicitud_id", sa.Integer(), nullable=False),
        sa.Column("estado_anterior", estado_solicitud_enum, nullable=True),
        sa.Column("estado_nuevo", estado_solicitud_enum, nullable=False),
        sa.Column("actor_ci", sa.String(length=20), nullable=True),
        sa.Column("comentario", sa.Text(), nullable=True),
        sa.Column("pdf_url", sa.String(length=500), nullable=True),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["solicitud_id"],
            ["solicitudes_movimiento.id"],
            name="fk_historial_solicitudes_solicitud",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["actor_ci"],
            ["users.ci"],
            name="fk_historial_solicitudes_actor_ci_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_historial_solicitudes"),
    )

    op.create_index(
        "ix_historial_solicitudes_id",
        "historial_solicitudes",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_historial_solicitudes_solicitud_id",
        "historial_solicitudes",
        ["solicitud_id"],
        unique=False,
    )


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_index("ix_historial_solicitudes_solicitud_id", table_name="historial_solicitudes")
    op.drop_index("ix_historial_solicitudes_id", table_name="historial_solicitudes")
    op.drop_table("historial_solicitudes")

    op.drop_index("ix_solicitudes_movimiento_tipo_recurso_recurso_id", table_name="solicitudes_movimiento")
    op.drop_index("ix_solicitudes_movimiento_revisor_ci", table_name="solicitudes_movimiento")
    op.drop_index("ix_solicitudes_movimiento_solicitante_ci", table_name="solicitudes_movimiento")
    op.drop_index("ix_solicitudes_movimiento_estado", table_name="solicitudes_movimiento")
    op.drop_index("ix_solicitudes_movimiento_id", table_name="solicitudes_movimiento")
    op.drop_table("solicitudes_movimiento")

    estado_solicitud_enum.drop(bind, checkfirst=True)
    tipo_recurso_enum.drop(bind, checkfirst=True)