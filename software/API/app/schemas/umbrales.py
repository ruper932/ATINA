# app/schemas/umbrales.py
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

# === PARÁMETROS DE UMBRAL ===
class ParametroUmbralBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    descripcion: str | None = None
    unidad: str | None = Field(None, max_length=30)

class ParametroUmbralCreate(ParametroUmbralBase): pass

class ParametroUmbralUpdate(ParametroUmbralBase):
    nombre: str | None = None

class ParametroUmbralResponse(ParametroUmbralBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# === CONFIGURACIONES DE UMBRAL ===
class ConfiguracionUmbralBase(BaseModel):
    parametro_umbral_id: int
    valor: Decimal = Field(..., max_digits=14, decimal_places=4)
    ambito_umbral_id: int
    editable: bool = True
    actualizado_por: int | None = None

class ConfiguracionUmbralCreate(ConfiguracionUmbralBase): pass

class ConfiguracionUmbralUpdate(BaseModel):
    valor: Decimal | None = None
    editable: bool | None = None
    actualizado_por: int | None = None

class ConfiguracionUmbralResponse(ConfiguracionUmbralBase):
    id: int
    actualizado_en: datetime
    model_config = ConfigDict(from_attributes=True)