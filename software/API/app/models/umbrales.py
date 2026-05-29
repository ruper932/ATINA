from datetime import datetime
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class AmbitoUmbral(Base):
    __tablename__ = "ambitos_umbral"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)


class ParametroUmbral(Base):
    __tablename__ = "parametros_umbral"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    unidad: Mapped[str | None] = mapped_column(String(30), nullable=True)


class ConfiguracionUmbral(Base):
    __tablename__ = "configuraciones_umbral"

    id: Mapped[int] = mapped_column(primary_key=True)
    parametro_umbral_id: Mapped[int] = mapped_column(
        ForeignKey("parametros_umbral.id", ondelete="RESTRICT"),
        nullable=False,
    )
    valor: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    ambito_umbral_id: Mapped[int] = mapped_column(
        ForeignKey("ambitos_umbral.id", ondelete="RESTRICT"),
        nullable=False,
    )
    editable: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=sa.true(),
    )
    actualizado_por_ci: Mapped[str | None] = mapped_column(
        String(20),
        ForeignKey("users.ci", ondelete="SET NULL"),
        nullable=True,
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class ConfiguracionUmbralInvernadero(Base):
    __tablename__ = "configuraciones_umbral_invernaderos"
    __table_args__ = (
        UniqueConstraint(
            "configuracion_umbral_id",
            "invernadero_id",
            name="uq_configuraciones_umbral_invernaderos",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    configuracion_umbral_id: Mapped[int] = mapped_column(
        ForeignKey("configuraciones_umbral.id", ondelete="CASCADE"),
        nullable=False,
    )
    invernadero_id: Mapped[int] = mapped_column(
        ForeignKey("invernaderos.id", ondelete="CASCADE"),
        nullable=False,
    )


class ConfiguracionUmbralSensor(Base):
    __tablename__ = "configuraciones_umbral_sensores"
    __table_args__ = (
        UniqueConstraint(
            "configuracion_umbral_id",
            "sensor_id",
            name="uq_configuraciones_umbral_sensores",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    configuracion_umbral_id: Mapped[int] = mapped_column(
        ForeignKey("configuraciones_umbral.id", ondelete="CASCADE"),
        nullable=False,
    )
    sensor_id: Mapped[int] = mapped_column(
        ForeignKey("sensores.id", ondelete="CASCADE"),
        nullable=False,
    )