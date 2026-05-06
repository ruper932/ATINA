import sqlalchemy as sa
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
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
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ModeloML(Base):
    __tablename__ = "modelos_ml"
    __table_args__ = (
        UniqueConstraint("nombre", "version", name="uq_modelos_ml"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    tipo_modelo: Mapped[str] = mapped_column(String(50), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    objetivo: Mapped[str] = mapped_column(String(100), nullable=False)
    framework: Mapped[str | None] = mapped_column(String(50), nullable=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    ruta_artefacto: Mapped[str | None] = mapped_column(Text, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=sa.text("true"))
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class PrediccionML(Base):
    __tablename__ = "predicciones_ml"
    __table_args__ = (
        UniqueConstraint("modelo_ml_id", "fuente_agua_id", "fecha_objetivo", name="uq_predicciones_ml"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    modelo_ml_id: Mapped[int] = mapped_column(
        ForeignKey("modelos_ml.id", ondelete="RESTRICT"),
        nullable=False,
    )
    fuente_agua_id: Mapped[int] = mapped_column(
        ForeignKey("fuentes_agua.id", ondelete="CASCADE"),
        nullable=False,
    )
    fecha_prediccion: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_objetivo: Mapped[date] = mapped_column(Date, nullable=False)
    volumen_predicho_l: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    margen_error: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    confianza_modelo: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    resumen_entrada_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    generado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class SimulacionML(Base):
    __tablename__ = "simulaciones_ml"
    __table_args__ = (
        CheckConstraint("horizonte_horas > 0", name="chk_simulaciones_ml_horizonte"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    modelo_ml_id: Mapped[int] = mapped_column(
        ForeignKey("modelos_ml.id", ondelete="RESTRICT"),
        nullable=False,
    )
    invernadero_id: Mapped[int] = mapped_column(
        ForeignKey("invernaderos.id", ondelete="CASCADE"),
        nullable=False,
    )
    fecha_generacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    horizonte_horas: Mapped[int] = mapped_column(Integer, nullable=False)
    escenario_simulacion_id: Mapped[int] = mapped_column(
        ForeignKey("escenarios_simulacion.id", ondelete="RESTRICT"),
        nullable=False,
    )
    nivel_riesgo_id: Mapped[int] = mapped_column(
        ForeignKey("niveles_riesgo.id", ondelete="RESTRICT"),
        nullable=False,
    )
    descripcion_resultado: Mapped[str | None] = mapped_column(Text, nullable=True)
    recomendacion: Mapped[str | None] = mapped_column(Text, nullable=True)
    generado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )