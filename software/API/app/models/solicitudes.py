from __future__ import annotations

import enum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class TipoRecursoSolicitud(str, enum.Enum):
    atrapaniebla = "atrapaniebla"
    fuenteagua = "fuenteagua"


class EstadoSolicitud(str, enum.Enum):
    pendiente = "pendiente"
    en_revision = "en_revision"
    aprobada = "aprobada"
    rechazada = "rechazada"
    cancelada = "cancelada"


class SolicitudMovimiento(Base):
    __tablename__ = "solicitudes_movimiento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tipo_recurso: Mapped[TipoRecursoSolicitud] = mapped_column(
        Enum(TipoRecursoSolicitud, name="tipo_recurso_solicitud_enum"),
        nullable=False,
    )
    recurso_id: Mapped[int] = mapped_column(Integer, nullable=False)

    solicitante_ci: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("users.ci", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    revisor_ci: Mapped[str | None] = mapped_column(
        String(20),
        ForeignKey("users.ci", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    ubicacion_origen_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("ubicaciones.id", ondelete="RESTRICT"),
        nullable=False,
    )
    ubicacion_destino_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("ubicaciones.id", ondelete="RESTRICT"),
        nullable=True,
    )
    ubicacion_destino_propuesta: Mapped[str | None] = mapped_column(Text, nullable=True)

    motivo: Mapped[str] = mapped_column(Text, nullable=False)
    observacion: Mapped[str | None] = mapped_column(Text, nullable=True)
    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    estado: Mapped[EstadoSolicitud] = mapped_column(
        Enum(EstadoSolicitud, name="estado_solicitud_enum"),
        nullable=False,
        default=EstadoSolicitud.pendiente,
        server_default=EstadoSolicitud.pendiente.value,
        index=True,
    )

    fecha_creacion: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    fecha_revision: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fecha_resolucion: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    creado_en: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    actualizado_en: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    historial: Mapped[list["HistorialSolicitud"]] = relationship(
        "HistorialSolicitud",
        back_populates="solicitud",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="HistorialSolicitud.id.asc()",
    )


class HistorialSolicitud(Base):
    __tablename__ = "historial_solicitudes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    solicitud_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("solicitudes_movimiento.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    estado_anterior: Mapped[EstadoSolicitud | None] = mapped_column(
        Enum(EstadoSolicitud, name="estado_solicitud_enum"),
        nullable=True,
    )
    estado_nuevo: Mapped[EstadoSolicitud] = mapped_column(
        Enum(EstadoSolicitud, name="estado_solicitud_enum"),
        nullable=False,
    )

    actor_ci: Mapped[str | None] = mapped_column(
        String(20),
        ForeignKey("users.ci", ondelete="SET NULL"),
        nullable=True,
    )
    comentario: Mapped[str | None] = mapped_column(Text, nullable=True)
    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    creado_en: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    solicitud: Mapped["SolicitudMovimiento"] = relationship(
        "SolicitudMovimiento",
        back_populates="historial",
    )