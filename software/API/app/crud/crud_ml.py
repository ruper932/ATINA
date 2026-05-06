# app/crud/crud_ml.py
from app.crud.base import CRUDBase
from app.models.ml import ModeloML, PrediccionML, SimulacionML
from app.schemas.ml import (
    ModeloMLCreate, ModeloMLUpdate,
    PrediccionMLCreate, PrediccionMLCreate, # Rara vez se actualizan predicciones
    SimulacionMLCreate, SimulacionMLCreate
)

class CRUDModeloML(CRUDBase[ModeloML, ModeloMLCreate, ModeloMLUpdate]): pass
class CRUDPrediccionML(CRUDBase[PrediccionML, PrediccionMLCreate, PrediccionMLCreate]): pass
class CRUDSimulacionML(CRUDBase[SimulacionML, SimulacionMLCreate, SimulacionMLCreate]): pass

modelo_ml = CRUDModeloML(ModeloML)
prediccion_ml = CRUDPrediccionML(PrediccionML)
simulacion_ml = CRUDSimulacionML(SimulacionML)