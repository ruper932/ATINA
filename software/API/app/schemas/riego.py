# app/schemas/riego.py
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

# === DECISIONES DE RIEGO ===
class DecisionRiegoBase(BaseModel):
    origen_decision_id: int
    modo_riego_id: int
    estado_valvula_id: int
    texto_decision: str | None = None

class DecisionRiegoCreate(DecisionRiegoBase):
    pass

class DecisionRiegoUpdate(DecisionRiegoBase):
    origen_decision_id: int | None = None
    modo_riego_id: int | None = None
    estado_valvula_id: int | None = None

class DecisionRiegoResponse(DecisionRiegoBase):
    id: int
    ejecutado_en: datetime
    model_config = ConfigDict(from_attributes=True)


# === EVENTOS DE RIEGO ===
class EventoRiegoBase(BaseModel):
    decision_riego_id: int
    inicio_evento: datetime
    fin_evento: datetime | None = None
    duracion_segundos: int | None = Field(None, ge=0)
    observaciones: str | None = None

class EventoRiegoCreate(EventoRiegoBase):
    pass

class EventoRiegoUpdate(BaseModel):
    # Usualmente un evento de riego solo se actualiza para marcar su 'fin_evento'
    fin_evento: datetime | None = None
    duracion_segundos: int | None = Field(None, ge=0)
    observaciones: str | None = None

class EventoRiegoResponse(EventoRiegoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# === ESTADO DE RIEGO ACTUAL ===
class EstadoRiegoActualBase(BaseModel):
    invernadero_id: int
    ultima_decision_id: int

class EstadoRiegoActualCreate(EstadoRiegoActualBase):
    pass

class EstadoRiegoActualUpdate(BaseModel):
    ultima_decision_id: int | None = None

class EstadoRiegoActualResponse(EstadoRiegoActualBase):
    id: int
    actualizado_en: datetime
    model_config = ConfigDict(from_attributes=True)