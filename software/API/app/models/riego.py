from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class DecisionRiego(Base):
    __tablename__ = "decisiones_riego"

    id: Mapped[int] = mapped_column(primary_key=True)
    origen_decision_id: Mapped[int] = mapped_column(
        ForeignKey("origenes_decision.id", ondelete="RESTRICT"),
        nullable=False,
    )
    modo_riego_id: Mapped[int] = mapped_column(
        ForeignKey("modos_riego.id", ondelete="RESTRICT"),
        nullable=False,
    )
    estado_valvula_id: Mapped[int] = mapped_column(
        ForeignKey("estados_valvula.id", ondelete="RESTRICT"),
        nullable=False,
    )
    texto_decision: Mapped[str | None] = mapped_column(Text, nullable=True)
    ejecutado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class DecisionRiegoInvernadero(Base):
    __tablename__ = "decisiones_riego_invernaderos"
    __table_args__ = (
        UniqueConstraint("decision_riego_id", "invernadero_id", name="uq_decisiones_riego_invernaderos"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    decision_riego_id: Mapped[int] = mapped_column(
        ForeignKey("decisiones_riego.id", ondelete="CASCADE"),
        nullable=False,
    )
    invernadero_id: Mapped[int] = mapped_column(
        ForeignKey("invernaderos.id", ondelete="RESTRICT"),
        nullable=False,
    )


class DecisionRiegoActuador(Base):
    __tablename__ = "decisiones_riego_actuadores"
    __table_args__ = (
        UniqueConstraint("decision_riego_id", "actuador_id", name="uq_decisiones_riego_actuadores"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    decision_riego_id: Mapped[int] = mapped_column(
        ForeignKey("decisiones_riego.id", ondelete="CASCADE"),
        nullable=False,
    )
    actuador_id: Mapped[int] = mapped_column(
        ForeignKey("actuadores.id", ondelete="RESTRICT"),
        nullable=False,
    )


class DecisionRiegoFuenteAgua(Base):
    __tablename__ = "decisiones_riego_fuentes_agua"
    __table_args__ = (
        UniqueConstraint("decision_riego_id", "fuente_agua_id", name="uq_decisiones_riego_fuentes_agua"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    decision_riego_id: Mapped[int] = mapped_column(
        ForeignKey("decisiones_riego.id", ondelete="CASCADE"),
        nullable=False,
    )
    fuente_agua_id: Mapped[int] = mapped_column(
        ForeignKey("fuentes_agua.id", ondelete="RESTRICT"),
        nullable=False,
    )


class MetricaDecisionRiego(Base):
    __tablename__ = "metricas_decision_riego"
    __table_args__ = (
        CheckConstraint(
            "(volumen_disponible_l IS NULL OR volumen_disponible_l >= 0) AND "
            "(demanda_estimada_l IS NULL OR demanda_estimada_l >= 0) AND "
            "(volumen_aplicado_l IS NULL OR volumen_aplicado_l >= 0)",
            name="chk_metricas_decision_riego_valores",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    decision_riego_id: Mapped[int] = mapped_column(
        ForeignKey("decisiones_riego.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    volumen_disponible_l: Mapped[float | None] = mapped_column(Numeric(14, 4), nullable=True)
    demanda_estimada_l: Mapped[float | None] = mapped_column(Numeric(14, 4), nullable=True)
    volumen_aplicado_l: Mapped[float | None] = mapped_column(Numeric(14, 4), nullable=True)


class EventoRiego(Base):
    __tablename__ = "eventos_riego"
    __table_args__ = (
        CheckConstraint("fin_evento IS NULL OR fin_evento >= inicio_evento", name="chk_eventos_riego_fechas"),
        CheckConstraint("duracion_segundos IS NULL OR duracion_segundos >= 0", name="chk_eventos_riego_duracion"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    decision_riego_id: Mapped[int] = mapped_column(
        ForeignKey("decisiones_riego.id", ondelete="CASCADE"),
        nullable=False,
    )
    inicio_evento: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fin_evento: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duracion_segundos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)


class EstadoRiegoActual(Base):
    __tablename__ = "estado_riego_actual"

    id: Mapped[int] = mapped_column(primary_key=True)
    invernadero_id: Mapped[int] = mapped_column(
        ForeignKey("invernaderos.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    ultima_decision_id: Mapped[int] = mapped_column(
        ForeignKey("decisiones_riego.id", ondelete="RESTRICT"),
        nullable=False,
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )