from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, SmallInteger, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Ubicacion(Base):
    __tablename__ = "ubicaciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo_ubicacion_id: Mapped[int] = mapped_column(
        ForeignKey("tipos_ubicacion.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    ubicacion_padre_id: Mapped[int | None] = mapped_column(
        ForeignKey("ubicaciones.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitud: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitud: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    altitud_m: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)


class Invernadero(Base):
    __tablename__ = "invernaderos"

    id: Mapped[int] = mapped_column(primary_key=True)
    ubicacion_id: Mapped[int] = mapped_column(
        ForeignKey("ubicaciones.id", ondelete="RESTRICT"),
        unique=True,
        nullable=False,
    )
    codigo: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    area_m2: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    prioridad_riego: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    estado_invernadero_id: Mapped[int] = mapped_column(
        ForeignKey("estados_invernadero.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class Atrapaniebla(Base):
    __tablename__ = "atrapanieblas"

    id: Mapped[int] = mapped_column(primary_key=True)
    ubicacion_id: Mapped[int] = mapped_column(
        ForeignKey("ubicaciones.id", ondelete="RESTRICT"),
        nullable=False,
    )
    codigo: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    area_malla_m2: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    tipo_malla: Mapped[str | None] = mapped_column(String(50), nullable=True)
    orientacion: Mapped[str | None] = mapped_column(String(30), nullable=True)
    estado_atrapaniebla_id: Mapped[int] = mapped_column(
        ForeignKey("estados_atrapaniebla.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    fecha_instalacion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class FuenteAgua(Base):
    __tablename__ = "fuentes_agua"

    id: Mapped[int] = mapped_column(primary_key=True)
    ubicacion_id: Mapped[int | None] = mapped_column(
        ForeignKey("ubicaciones.id", ondelete="SET NULL"),
        nullable=True,
    )
    tipo_fuente_agua_id: Mapped[int] = mapped_column(
        ForeignKey("tipos_fuente_agua.id", ondelete="RESTRICT"),
        nullable=False,
    )
    codigo: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    capacidad_l: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    estado_fuente_agua_id: Mapped[int] = mapped_column(
        ForeignKey("estados_fuente_agua.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class FuenteAguaAtrapaniebla(Base):
    __tablename__ = "fuentes_agua_atrapanieblas"

    id: Mapped[int] = mapped_column(primary_key=True)
    fuente_agua_id: Mapped[int] = mapped_column(
        ForeignKey("fuentes_agua.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    atrapaniebla_id: Mapped[int] = mapped_column(
        ForeignKey("atrapanieblas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )