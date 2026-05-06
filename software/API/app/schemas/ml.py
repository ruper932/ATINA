# app/schemas/ml.py
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

# === MODELOS ML ===
class ModeloMLBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    tipo_modelo: str = Field(..., max_length=50)
    version: str = Field(..., max_length=50)
    objetivo: str = Field(..., max_length=100)
    framework: str | None = Field(None, max_length=50)
    descripcion: str | None = None
    ruta_artefacto: str | None = None
    activo: bool = True

class ModeloMLCreate(ModeloMLBase): pass

class ModeloMLUpdate(ModeloMLBase):
    nombre: str | None = None
    tipo_modelo: str | None = None
    version: str | None = None
    objetivo: str | None = None
    activo: bool | None = None

class ModeloMLResponse(ModeloMLBase):
    id: int
    creado_en: datetime
    model_config = ConfigDict(from_attributes=True)


# === PREDICCIONES ML ===
class PrediccionMLBase(BaseModel):
    modelo_ml_id: int
    fuente_agua_id: int
    fecha_prediccion: date
    fecha_objetivo: date
    volumen_predicho_l: Decimal = Field(..., max_digits=14, decimal_places=4)
    margen_error: Decimal | None = Field(None, max_digits=10, decimal_places=4)
    confianza_modelo: Decimal | None = Field(None, max_digits=5, decimal_places=2)
    resumen_entrada_json: dict | None = None

class PrediccionMLCreate(PrediccionMLBase): pass

class PrediccionMLResponse(PrediccionMLBase):
    id: int
    generado_en: datetime
    model_config = ConfigDict(from_attributes=True)


# === SIMULACIONES ML ===
class SimulacionMLBase(BaseModel):
    modelo_ml_id: int
    invernadero_id: int
    horizonte_horas: int = Field(..., gt=0)
    escenario_simulacion_id: int
    nivel_riesgo_id: int
    descripcion_resultado: str | None = None
    recomendacion: str | None = None

class SimulacionMLCreate(SimulacionMLBase): pass

class SimulacionMLResponse(SimulacionMLBase):
    id: int
    fecha_generacion: datetime
    generado_en: datetime
    model_config = ConfigDict(from_attributes=True)