"""add dispositivos sensores y actuadores

Revision ID: 8aad80fceaa7
Revises: a2f0088855d4
Create Date: 2026-05-05 18:39:17.054883
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "8aad80fceaa7"
down_revision: Union[str, Sequence[str], None] = "a2f0088855d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "calidades_dato",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=30), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nombre"),
    )

    op.create_table(
        "estados_actuador",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=30), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nombre"),
    )

    op.create_table(
        "estados_dispositivo",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=30), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nombre"),
    )

    op.create_table(
        "estados_sensor",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=30), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nombre"),
    )

    op.create_table(
        "tipos_actuador",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=50), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nombre"),
    )

    op.create_table(
        "tipos_dispositivo",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=50), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nombre"),
    )

    op.create_table(
        "tipos_sensor",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=50), nullable=False),
        sa.Column("variable_medida", sa.String(length=50), nullable=False),
        sa.Column("unidad_base", sa.String(length=30), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nombre"),
    )

    op.create_table(
        "dispositivos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tipo_dispositivo_id", sa.Integer(), nullable=False),
        sa.Column("codigo", sa.String(length=50), nullable=False),
        sa.Column("nombre", sa.String(length=100), nullable=False),
        sa.Column("identificador_local", sa.String(length=100), nullable=True),
        sa.Column("ip_local", postgresql.INET(), nullable=True),
        sa.Column("version_firmware", sa.String(length=50), nullable=True),
        sa.Column("estado_dispositivo_id", sa.Integer(), nullable=False),
        sa.Column("ultima_conexion", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["estado_dispositivo_id"],
            ["estados_dispositivo.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["tipo_dispositivo_id"],
            ["tipos_dispositivo.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codigo"),
    )
    op.create_index(
        op.f("ix_dispositivos_estado_dispositivo_id"),
        "dispositivos",
        ["estado_dispositivo_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_dispositivos_tipo_dispositivo_id"),
        "dispositivos",
        ["tipo_dispositivo_id"],
        unique=False,
    )

    op.create_table(
        "actuadores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("dispositivo_id", sa.Integer(), nullable=False),
        sa.Column("tipo_actuador_id", sa.Integer(), nullable=False),
        sa.Column("codigo", sa.String(length=50), nullable=False),
        sa.Column("nombre", sa.String(length=100), nullable=False),
        sa.Column("estado_actuador_id", sa.Integer(), nullable=False),
        sa.Column("fecha_instalacion", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(
            ["dispositivo_id"],
            ["dispositivos.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["estado_actuador_id"],
            ["estados_actuador.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["tipo_actuador_id"],
            ["tipos_actuador.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codigo"),
    )
    op.create_index(
        op.f("ix_actuadores_dispositivo_id"),
        "actuadores",
        ["dispositivo_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_actuadores_estado_actuador_id"),
        "actuadores",
        ["estado_actuador_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_actuadores_tipo_actuador_id"),
        "actuadores",
        ["tipo_actuador_id"],
        unique=False,
    )

    op.create_table(
        "dispositivos_ubicaciones",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("dispositivo_id", sa.Integer(), nullable=False),
        sa.Column("ubicacion_id", sa.Integer(), nullable=False),
        sa.Column("fecha_inicio", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fecha_fin", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "fecha_fin IS NULL OR fecha_fin >= fecha_inicio",
            name="chk_dispositivos_ubicaciones_fechas",
        ),
        sa.ForeignKeyConstraint(
            ["dispositivo_id"],
            ["dispositivos.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["ubicacion_id"],
            ["ubicaciones.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "dispositivo_id",
            "ubicacion_id",
            "fecha_inicio",
            name="uq_dispositivos_ubicaciones",
        ),
    )
    op.create_index(
        op.f("ix_dispositivos_ubicaciones_dispositivo_id"),
        "dispositivos_ubicaciones",
        ["dispositivo_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_dispositivos_ubicaciones_ubicacion_id"),
        "dispositivos_ubicaciones",
        ["ubicacion_id"],
        unique=False,
    )

    op.create_table(
        "sensores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("dispositivo_id", sa.Integer(), nullable=False),
        sa.Column("tipo_sensor_id", sa.Integer(), nullable=False),
        sa.Column("codigo", sa.String(length=50), nullable=False),
        sa.Column("nombre", sa.String(length=100), nullable=False),
        sa.Column("modelo", sa.String(length=50), nullable=True),
        sa.Column("numero_serie", sa.String(length=100), nullable=True),
        sa.Column("precision_valor", sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column("estado_sensor_id", sa.Integer(), nullable=False),
        sa.Column("fecha_instalacion", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(
            ["dispositivo_id"],
            ["dispositivos.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["estado_sensor_id"],
            ["estados_sensor.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["tipo_sensor_id"],
            ["tipos_sensor.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codigo"),
    )
    op.create_index(
        op.f("ix_sensores_dispositivo_id"),
        "sensores",
        ["dispositivo_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_sensores_estado_sensor_id"),
        "sensores",
        ["estado_sensor_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_sensores_tipo_sensor_id"),
        "sensores",
        ["tipo_sensor_id"],
        unique=False,
    )

    op.create_table(
        "actuadores_invernaderos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("actuador_id", sa.Integer(), nullable=False),
        sa.Column("invernadero_id", sa.Integer(), nullable=False),
        sa.Column("fecha_inicio", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fecha_fin", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "fecha_fin IS NULL OR fecha_fin >= fecha_inicio",
            name="chk_actuadores_invernaderos_fechas",
        ),
        sa.ForeignKeyConstraint(
            ["actuador_id"],
            ["actuadores.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["invernadero_id"],
            ["invernaderos.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "actuador_id",
            "invernadero_id",
            "fecha_inicio",
            name="uq_actuadores_invernaderos",
        ),
    )
    op.create_index(
        op.f("ix_actuadores_invernaderos_actuador_id"),
        "actuadores_invernaderos",
        ["actuador_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_actuadores_invernaderos_invernadero_id"),
        "actuadores_invernaderos",
        ["invernadero_id"],
        unique=False,
    )

    op.create_table(
        "calibraciones_sensor",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sensor_id", sa.Integer(), nullable=False),
        sa.Column("tipo_calibracion", sa.String(length=50), nullable=False),
        sa.Column("valor_anterior", sa.Numeric(precision=14, scale=4), nullable=True),
        sa.Column("valor_nuevo", sa.Numeric(precision=14, scale=4), nullable=False),
        sa.Column("motivo", sa.Text(), nullable=True),
        sa.Column("usuario_id", sa.Integer(), nullable=True),
        sa.Column(
            "fecha_calibracion",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["sensor_id"],
            ["sensores.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_calibraciones_sensor_sensor_id"),
        "calibraciones_sensor",
        ["sensor_id"],
        unique=False,
    )

    op.create_table(
        "dispositivos_fuentes_agua",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("dispositivo_id", sa.Integer(), nullable=False),
        sa.Column("fuente_agua_id", sa.Integer(), nullable=False),
        sa.Column("fecha_inicio", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fecha_fin", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "fecha_fin IS NULL OR fecha_fin >= fecha_inicio",
            name="chk_dispositivos_fuentes_agua_fechas",
        ),
        sa.ForeignKeyConstraint(
            ["dispositivo_id"],
            ["dispositivos.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["fuente_agua_id"],
            ["fuentes_agua.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "dispositivo_id",
            "fuente_agua_id",
            "fecha_inicio",
            name="uq_dispositivos_fuentes_agua",
        ),
    )
    op.create_index(
        op.f("ix_dispositivos_fuentes_agua_dispositivo_id"),
        "dispositivos_fuentes_agua",
        ["dispositivo_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_dispositivos_fuentes_agua_fuente_agua_id"),
        "dispositivos_fuentes_agua",
        ["fuente_agua_id"],
        unique=False,
    )

    op.create_table(
        "lecturas_sensor",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sensor_id", sa.Integer(), nullable=False),
        sa.Column("valor", sa.Numeric(precision=14, scale=4), nullable=False),
        sa.Column("calidad_dato_id", sa.Integer(), nullable=False),
        sa.Column("timestamp_lectura", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "timestamp_recepcion",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("metadatos_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(
            ["calidad_dato_id"],
            ["calidades_dato.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["sensor_id"],
            ["sensores.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_lecturas_sensor_sensor_id"),
        "lecturas_sensor",
        ["sensor_id"],
        unique=False,
    )
    op.create_index(
        "idx_lecturas_sensor_sensor_fecha",
        "lecturas_sensor",
        ["sensor_id", sa.text("timestamp_lectura DESC")],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_lecturas_sensor_sensor_fecha", table_name="lecturas_sensor")
    op.drop_index(op.f("ix_lecturas_sensor_sensor_id"), table_name="lecturas_sensor")
    op.drop_table("lecturas_sensor")

    op.drop_index(
        op.f("ix_dispositivos_fuentes_agua_fuente_agua_id"),
        table_name="dispositivos_fuentes_agua",
    )
    op.drop_index(
        op.f("ix_dispositivos_fuentes_agua_dispositivo_id"),
        table_name="dispositivos_fuentes_agua",
    )
    op.drop_table("dispositivos_fuentes_agua")

    op.drop_index(
        op.f("ix_calibraciones_sensor_sensor_id"),
        table_name="calibraciones_sensor",
    )
    op.drop_table("calibraciones_sensor")

    op.drop_index(
        op.f("ix_actuadores_invernaderos_invernadero_id"),
        table_name="actuadores_invernaderos",
    )
    op.drop_index(
        op.f("ix_actuadores_invernaderos_actuador_id"),
        table_name="actuadores_invernaderos",
    )
    op.drop_table("actuadores_invernaderos")

    op.drop_index(op.f("ix_sensores_tipo_sensor_id"), table_name="sensores")
    op.drop_index(op.f("ix_sensores_estado_sensor_id"), table_name="sensores")
    op.drop_index(op.f("ix_sensores_dispositivo_id"), table_name="sensores")
    op.drop_table("sensores")

    op.drop_index(
        op.f("ix_dispositivos_ubicaciones_ubicacion_id"),
        table_name="dispositivos_ubicaciones",
    )
    op.drop_index(
        op.f("ix_dispositivos_ubicaciones_dispositivo_id"),
        table_name="dispositivos_ubicaciones",
    )
    op.drop_table("dispositivos_ubicaciones")

    op.drop_index(op.f("ix_actuadores_tipo_actuador_id"), table_name="actuadores")
    op.drop_index(op.f("ix_actuadores_estado_actuador_id"), table_name="actuadores")
    op.drop_index(op.f("ix_actuadores_dispositivo_id"), table_name="actuadores")
    op.drop_table("actuadores")

    op.drop_index(op.f("ix_dispositivos_tipo_dispositivo_id"), table_name="dispositivos")
    op.drop_index(op.f("ix_dispositivos_estado_dispositivo_id"), table_name="dispositivos")
    op.drop_table("dispositivos")

    op.drop_table("tipos_sensor")
    op.drop_table("tipos_dispositivo")
    op.drop_table("tipos_actuador")
    op.drop_table("estados_sensor")
    op.drop_table("estados_dispositivo")
    op.drop_table("estados_actuador")
    op.drop_table("calidades_dato")