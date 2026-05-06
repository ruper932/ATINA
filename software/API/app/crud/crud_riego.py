# app/crud/crud_riego.py
from app.crud.base import CRUDBase
from app.models.riego import DecisionRiego, EventoRiego, EstadoRiegoActual
from app.schemas.riego import (
    DecisionRiegoCreate, DecisionRiegoUpdate,
    EventoRiegoCreate, EventoRiegoUpdate,
    EstadoRiegoActualCreate, EstadoRiegoActualUpdate
)

class CRUDDecisionRiego(CRUDBase[DecisionRiego, DecisionRiegoCreate, DecisionRiegoUpdate]): pass
class CRUDEventoRiego(CRUDBase[EventoRiego, EventoRiegoCreate, EventoRiegoUpdate]): pass
class CRUDEstadoRiegoActual(CRUDBase[EstadoRiegoActual, EstadoRiegoActualCreate, EstadoRiegoActualUpdate]): pass

decision_riego = CRUDDecisionRiego(DecisionRiego)
evento_riego = CRUDEventoRiego(EventoRiego)
estado_riego_actual = CRUDEstadoRiegoActual(EstadoRiegoActual)