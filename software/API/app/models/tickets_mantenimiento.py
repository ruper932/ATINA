from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class TipoRecursoTicket(str, Enum):
    dispositivo = "dispositivo"
    sensor = "sensor"
    actuador = "actuador"


class EstadoTicketMantenimiento(str, Enum):
    pendiente = "pendiente"
    en_revision = "en_revision"
    terminado = "terminado"
    cancelado = "cancelado"


class ResultadoRevisionTicket(str, Enum):
    danado = "danado"
    mantenimiento = "mantenimiento"
    sin_falla = "sin_falla"


class TicketMantenimiento(Base):
    __tablename__ = "tickets_mantenimiento"

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo_recurso: Mapped[TipoRecursoTicket] = mapped_column(
        SAEnum(TipoRecursoTicket, name="tipo_recurso_ticket"), nullable=False, index=True
    )
    recurso_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    reportante_ci: Mapped[str] = mapped_column(
        String(20), ForeignKey("users.ci", ondelete="RESTRICT"), nullable=False, index=True
    )
    tecnico_ci: Mapped[str | None] = mapped_column(
        String(20), ForeignKey("users.ci", ondelete="SET NULL"), nullable=True, index=True
    )
    descripcion_problema: Mapped[str] = mapped_column(Text, nullable=False)
    observacion_tecnica: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[EstadoTicketMantenimiento] = mapped_column(
        SAEnum(EstadoTicketMantenimiento, name="estado_ticket_mantenimiento"), nullable=False, index=True
    )
    resultado_revision: Mapped[ResultadoRevisionTicket | None] = mapped_column(
        SAEnum(ResultadoRevisionTicket, name="resultado_revision_ticket"), nullable=True
    )
    fecha_reporte: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    fecha_toma: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fecha_cierre: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    historial = relationship(
        "HistorialTicketMantenimiento",
        back_populates="ticket",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class HistorialTicketMantenimiento(Base):
    __tablename__ = "historial_tickets_mantenimiento"

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets_mantenimiento.id", ondelete="CASCADE"), nullable=False, index=True
    )
    estado_anterior: Mapped[EstadoTicketMantenimiento | None] = mapped_column(
        SAEnum(EstadoTicketMantenimiento, name="estado_ticket_mantenimiento_historial"), nullable=True
    )
    estado_nuevo: Mapped[EstadoTicketMantenimiento] = mapped_column(
        SAEnum(EstadoTicketMantenimiento, name="estado_ticket_mantenimiento_historial_2"), nullable=False
    )
    actor_ci: Mapped[str | None] = mapped_column(
        String(20), ForeignKey("users.ci", ondelete="SET NULL"), nullable=True
    )
    comentario: Mapped[str | None] = mapped_column(Text, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    ticket = relationship("TicketMantenimiento", back_populates="historial")