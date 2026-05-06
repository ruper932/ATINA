from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class SeveridadAlerta(Base):
    __tablename__ = "severidades_alerta"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)


class OrigenAlerta(Base):
    __tablename__ = "origenes_alerta"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)


class EstadoAlerta(Base):
    __tablename__ = "estados_alerta"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)


class TipoNotificacion(Base):
    __tablename__ = "tipos_notificacion"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)


class EstadoEnvio(Base):
    __tablename__ = "estados_envio"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)


class Alerta(Base):
    __tablename__ = "alertas"
    __table_args__ = (
        CheckConstraint(
            "fecha_reconocimiento IS NULL OR fecha_reconocimiento >= fecha_generacion",
            name="chk_alertas_reconocimiento",
        ),
        Index("idx_alertas_estado_alerta_id", "estado_alerta_id"),
        Index("idx_alertas_fecha_generacion", text("fecha_generacion DESC")),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo_alerta: Mapped[str] = mapped_column(String(50), nullable=False)
    severidad_alerta_id: Mapped[int] = mapped_column(
        ForeignKey("severidades_alerta.id", ondelete="RESTRICT"),
        nullable=False,
    )
    origen_alerta_id: Mapped[int] = mapped_column(
        ForeignKey("origenes_alerta.id", ondelete="RESTRICT"),
        nullable=False,
    )
    mensaje: Mapped[str] = mapped_column(Text, nullable=False)
    estado_alerta_id: Mapped[int] = mapped_column(
        ForeignKey("estados_alerta.id", ondelete="RESTRICT"),
        nullable=False,
    )
    fecha_generacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    fecha_reconocimiento: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    usuario_reconoce_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )


class AlertaInvernadero(Base):
    __tablename__ = "alertas_invernaderos"
    __table_args__ = (
        UniqueConstraint("alerta_id", "invernadero_id", name="uq_alertas_invernaderos"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    alerta_id: Mapped[int] = mapped_column(
        ForeignKey("alertas.id", ondelete="CASCADE"),
        nullable=False,
    )
    invernadero_id: Mapped[int] = mapped_column(
        ForeignKey("invernaderos.id", ondelete="RESTRICT"),
        nullable=False,
    )


class AlertaDispositivo(Base):
    __tablename__ = "alertas_dispositivos"
    __table_args__ = (
        UniqueConstraint("alerta_id", "dispositivo_id", name="uq_alertas_dispositivos"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    alerta_id: Mapped[int] = mapped_column(
        ForeignKey("alertas.id", ondelete="CASCADE"),
        nullable=False,
    )
    dispositivo_id: Mapped[int] = mapped_column(
        ForeignKey("dispositivos.id", ondelete="RESTRICT"),
        nullable=False,
    )


class AlertaSensor(Base):
    __tablename__ = "alertas_sensores"
    __table_args__ = (
        UniqueConstraint("alerta_id", "sensor_id", name="uq_alertas_sensores"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    alerta_id: Mapped[int] = mapped_column(
        ForeignKey("alertas.id", ondelete="CASCADE"),
        nullable=False,
    )
    sensor_id: Mapped[int] = mapped_column(
        ForeignKey("sensores.id", ondelete="RESTRICT"),
        nullable=False,
    )


class AlertaDecisionRiego(Base):
    __tablename__ = "alertas_decisiones_riego"
    __table_args__ = (
        UniqueConstraint(
            "alerta_id",
            "decision_riego_id",
            name="uq_alertas_decisiones_riego",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    alerta_id: Mapped[int] = mapped_column(
        ForeignKey("alertas.id", ondelete="CASCADE"),
        nullable=False,
    )
    decision_riego_id: Mapped[int] = mapped_column(
        ForeignKey("decisiones_riego.id", ondelete="RESTRICT"),
        nullable=False,
    )


class AlertaSimulacionML(Base):
    __tablename__ = "alertas_simulaciones_ml"
    __table_args__ = (
        UniqueConstraint(
            "alerta_id",
            "simulacion_ml_id",
            name="uq_alertas_simulaciones_ml",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    alerta_id: Mapped[int] = mapped_column(
        ForeignKey("alertas.id", ondelete="CASCADE"),
        nullable=False,
    )
    simulacion_ml_id: Mapped[int] = mapped_column(
        ForeignKey("simulaciones_ml.id", ondelete="RESTRICT"),
        nullable=False,
    )


class NotificacionLocal(Base):
    __tablename__ = "notificaciones_locales"
    __table_args__ = (
        CheckConstraint(
            "fecha_confirmacion IS NULL OR fecha_envio IS NULL OR fecha_confirmacion >= fecha_envio",
            name="chk_notificaciones_locales_fechas",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    alerta_id: Mapped[int] = mapped_column(
        ForeignKey("alertas.id", ondelete="CASCADE"),
        nullable=False,
    )
    tipo_notificacion_id: Mapped[int] = mapped_column(
        ForeignKey("tipos_notificacion.id", ondelete="RESTRICT"),
        nullable=False,
    )
    estado_envio_id: Mapped[int] = mapped_column(
        ForeignKey("estados_envio.id", ondelete="RESTRICT"),
        nullable=False,
    )
    fecha_envio: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    fecha_confirmacion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    detalle_respuesta: Mapped[str | None] = mapped_column(Text, nullable=True)