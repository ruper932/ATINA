from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.solicitudes import EstadoSolicitud, TipoRecursoSolicitud


class HistorialSolicitudBase(BaseModel):
    comentario: Optional[str] = None
    pdf_url: Optional[str] = Field(default=None, max_length=500)


class HistorialSolicitudRead(HistorialSolicitudBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    solicitud_id: int
    estado_anterior: Optional[EstadoSolicitud] = None
    estado_nuevo: EstadoSolicitud
    actor_ci: Optional[str] = None
    creado_en: datetime


class SolicitudMovimientoCreate(BaseModel):
    tipo_recurso: TipoRecursoSolicitud
    recurso_id: int = Field(gt=0)
    ubicacion_destino_id: Optional[int] = Field(default=None, gt=0)
    ubicacion_destino_propuesta: Optional[str] = None
    motivo: str = Field(min_length=1)
    pdf_url: Optional[str] = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_destino(self):
        if not self.ubicacion_destino_id and not self.ubicacion_destino_propuesta:
            raise ValueError("Debes enviar ubicacion_destino_id o ubicacion_destino_propuesta")
        return self


class SolicitudTomarRevision(BaseModel):
    comentario: Optional[str] = None


class SolicitudResolver(BaseModel):
    aprobar: bool
    observacion: str = Field(min_length=1)
    ubicacion_destino_id: Optional[int] = Field(default=None, gt=0)
    pdf_url: Optional[str] = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_aprobacion(self):
        if self.aprobar and not self.ubicacion_destino_id:
            raise ValueError("Para aprobar debes enviar ubicacion_destino_id")
        return self


class SolicitudCancelar(BaseModel):
    comentario: Optional[str] = None


class SolicitudMovimientoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo_recurso: TipoRecursoSolicitud
    recurso_id: int
    solicitante_ci: str
    revisor_ci: Optional[str] = None
    ubicacion_origen_id: int
    ubicacion_destino_id: Optional[int] = None
    ubicacion_destino_propuesta: Optional[str] = None
    motivo: str
    observacion: Optional[str] = None
    pdf_url: Optional[str] = None
    estado: EstadoSolicitud
    fecha_creacion: datetime
    fecha_revision: Optional[datetime] = None
    fecha_resolucion: Optional[datetime] = None
    creado_en: datetime
    actualizado_en: datetime


class SolicitudMovimientoDetail(SolicitudMovimientoRead):
    historial: list[HistorialSolicitudRead] = []