# app/schemas/alertas.py
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

# === ALERTAS ===
class AlertaBase(BaseModel):
    tipo_alerta: str = Field(..., max_length=50)
    severidad_alerta_id: int
    origen_alerta_id: int
    mensaje: str
    estado_alerta_id: int
    fecha_reconocimiento: datetime | None = None
    usuario_reconoce_id: int | None = None

class AlertaCreate(AlertaBase):
    pass

class AlertaUpdate(BaseModel):
    estado_alerta_id: int | None = None
    fecha_reconocimiento: datetime | None = None
    usuario_reconoce_id: int | None = None

class AlertaResponse(AlertaBase):
    id: int
    fecha_generacion: datetime
    model_config = ConfigDict(from_attributes=True)


# === NOTIFICACIONES LOCALES ===
class NotificacionLocalBase(BaseModel):
    alerta_id: int
    tipo_notificacion_id: int
    estado_envio_id: int
    fecha_envio: datetime | None = None
    fecha_confirmacion: datetime | None = None
    detalle_respuesta: str | None = None

class NotificacionLocalCreate(NotificacionLocalBase):
    pass

class NotificacionLocalUpdate(BaseModel):
    estado_envio_id: int | None = None
    fecha_envio: datetime | None = None
    fecha_confirmacion: datetime | None = None
    detalle_respuesta: str | None = None

class NotificacionLocalResponse(NotificacionLocalBase):
    id: int
    model_config = ConfigDict(from_attributes=True)