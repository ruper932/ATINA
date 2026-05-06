from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Dispositivo(Base):
    __tablename__ = "dispositivos"

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo_dispositivo_id: Mapped[int] = mapped_column(
        ForeignKey("tipos_dispositivo.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    identificador_local: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_local: Mapped[str | None] = mapped_column(INET, nullable=True)
    version_firmware: Mapped[str | None] = mapped_column(String(50), nullable=True)
    estado_dispositivo_id: Mapped[int] = mapped_column(
        ForeignKey("estados_dispositivo.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    ultima_conexion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class DispositivoUbicacion(Base):
    __tablename__ = "dispositivos_ubicaciones"
    __table_args__ = (
        UniqueConstraint("dispositivo_id", "ubicacion_id", "fecha_inicio", name="uq_dispositivos_ubicaciones"),
        CheckConstraint("fecha_fin IS NULL OR fecha_fin >= fecha_inicio", name="chk_dispositivos_ubicaciones_fechas"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    dispositivo_id: Mapped[int] = mapped_column(
        ForeignKey("dispositivos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ubicacion_id: Mapped[int] = mapped_column(
        ForeignKey("ubicaciones.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    fecha_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_fin: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DispositivoFuenteAgua(Base):
    __tablename__ = "dispositivos_fuentes_agua"
    __table_args__ = (
        UniqueConstraint("dispositivo_id", "fuente_agua_id", "fecha_inicio", name="uq_dispositivos_fuentes_agua"),
        CheckConstraint("fecha_fin IS NULL OR fecha_fin >= fecha_inicio", name="chk_dispositivos_fuentes_agua_fechas"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    dispositivo_id: Mapped[int] = mapped_column(
        ForeignKey("dispositivos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fuente_agua_id: Mapped[int] = mapped_column(
        ForeignKey("fuentes_agua.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    fecha_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_fin: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Sensor(Base):
    __tablename__ = "sensores"

    id: Mapped[int] = mapped_column(primary_key=True)
    dispositivo_id: Mapped[int] = mapped_column(
        ForeignKey("dispositivos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tipo_sensor_id: Mapped[int] = mapped_column(
        ForeignKey("tipos_sensor.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    modelo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    numero_serie: Mapped[str | None] = mapped_column(String(100), nullable=True)
    precision_valor: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    estado_sensor_id: Mapped[int] = mapped_column(
        ForeignKey("estados_sensor.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    fecha_instalacion: Mapped[date | None] = mapped_column(Date, nullable=True)


class LecturaSensor(Base):
    __tablename__ = "lecturas_sensor"

    id: Mapped[int] = mapped_column(primary_key=True)
    sensor_id: Mapped[int] = mapped_column(
        ForeignKey("sensores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    valor: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    calidad_dato_id: Mapped[int] = mapped_column(
        ForeignKey("calidades_dato.id", ondelete="RESTRICT"),
        nullable=False,
    )
    timestamp_lectura: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    timestamp_recepcion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    metadatos_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class CalibracionSensor(Base):
    __tablename__ = "calibraciones_sensor"

    id: Mapped[int] = mapped_column(primary_key=True)
    sensor_id: Mapped[int] = mapped_column(
        ForeignKey("sensores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tipo_calibracion: Mapped[str] = mapped_column(String(50), nullable=False)
    valor_anterior: Mapped[float | None] = mapped_column(Numeric(14, 4), nullable=True)
    valor_nuevo: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    motivo: Mapped[str | None] = mapped_column(Text, nullable=True)
    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    fecha_calibracion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class Actuador(Base):
    __tablename__ = "actuadores"

    id: Mapped[int] = mapped_column(primary_key=True)
    dispositivo_id: Mapped[int] = mapped_column(
        ForeignKey("dispositivos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tipo_actuador_id: Mapped[int] = mapped_column(
        ForeignKey("tipos_actuador.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    estado_actuador_id: Mapped[int] = mapped_column(
        ForeignKey("estados_actuador.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    fecha_instalacion: Mapped[date | None] = mapped_column(Date, nullable=True)


class ActuadorInvernadero(Base):
    __tablename__ = "actuadores_invernaderos"
    __table_args__ = (
        UniqueConstraint("actuador_id", "invernadero_id", "fecha_inicio", name="uq_actuadores_invernaderos"),
        CheckConstraint("fecha_fin IS NULL OR fecha_fin >= fecha_inicio", name="chk_actuadores_invernaderos_fechas"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    actuador_id: Mapped[int] = mapped_column(
        ForeignKey("actuadores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    invernadero_id: Mapped[int] = mapped_column(
        ForeignKey("invernaderos.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    fecha_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_fin: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)