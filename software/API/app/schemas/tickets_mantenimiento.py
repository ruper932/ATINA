from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.tickets_mantenimiento import (
    EstadoTicketMantenimiento,
    ResultadoRevisionTicket,
    TipoRecursoTicket,
)


class TicketMantenimientoBase(BaseModel):
    tipo_recurso: TipoRecursoTicket
    recurso_id: int
    descripcion_problema: str = Field(..., min_length=5)


class TicketMantenimientoCreate(TicketMantenimientoBase):
    pass


class TicketTomarRevision(BaseModel):
    comentario: str | None = None


class TicketResolver(BaseModel):
    resultado_revision: ResultadoRevisionTicket
    observacion_tecnica: str = Field(..., min_length=3)


class TicketCancelar(BaseModel):
    comentario: str | None = None


class HistorialTicketMantenimientoRead(BaseModel):
    id: int
    ticket_id: int
    estado_anterior: EstadoTicketMantenimiento | None = None
    estado_nuevo: EstadoTicketMantenimiento
    actor_ci: str | None = None
    comentario: str | None = None
    creado_en: datetime
    
    model_config = ConfigDict(from_attributes=True)


class TicketMantenimientoRead(BaseModel):
    id: int
    tipo_recurso: TipoRecursoTicket
    recurso_id: int
    reportante_ci: str
    tecnico_ci: str | None = None
    descripcion_problema: str
    observacion_tecnica: str | None = None
    estado: EstadoTicketMantenimiento
    resultado_revision: ResultadoRevisionTicket | None = None
    fecha_reporte: datetime
    fecha_toma: datetime | None = None
    fecha_cierre: datetime | None = None
    creado_en: datetime
    actualizado_en: datetime
    historial: list[HistorialTicketMantenimientoRead] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)