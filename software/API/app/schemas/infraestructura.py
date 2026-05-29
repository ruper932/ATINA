# app/schemas/infraestructura.py
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

# === UBICACIONES ===
class UbicacionBase(BaseModel):
    tipo_ubicacion_id: int
    ubicacion_padre_id: int | None = None
    nombre: str = Field(..., max_length=120)
    descripcion: str | None = None
    latitud: Decimal | None = None
    longitud: Decimal | None = None
    altitud_m: Decimal | None = None

class UbicacionCreate(UbicacionBase): pass

class UbicacionUpdate(UbicacionBase):
    tipo_ubicacion_id: int | None = None
    nombre: str | None = None

class UbicacionResponse(UbicacionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# === INVERNADEROS ===
class InvernaderoBase(BaseModel):
    ubicacion_id: int
    codigo: str = Field(..., max_length=30)
    nombre: str = Field(..., max_length=100)
    descripcion: str | None = None
    area_m2: Decimal = Field(..., gt=0)
    prioridad_riego: int = Field(default=1, ge=1, le=10)
    estado_invernadero_id: int


class InvernaderoCreate(InvernaderoBase): pass


class InvernaderoUpdate(InvernaderoBase):
    ubicacion_id: int | None = None
    codigo: str | None = None
    nombre: str | None = None
    area_m2: Decimal | None = None
    estado_invernadero_id: int | None = None


class InvernaderoResponse(InvernaderoBase):
    id: int
    creado_en: datetime
    ubicacion_nombre: str | None = None
    estado_invernadero_nombre: str | None = None
    model_config = ConfigDict(from_attributes=True)

# === ATRAPANIEBLAS ===
class AtrapanieblaBase(BaseModel):
    ubicacion_id: int
    codigo: str = Field(..., max_length=30)
    nombre: str = Field(..., max_length=100)
    area_malla_m2: Decimal = Field(..., gt=0)
    tipo_malla: str | None = Field(None, max_length=50)
    orientacion: str | None = Field(None, max_length=30)
    estado_atrapaniebla_id: int
    fecha_instalacion: datetime | None = None

class AtrapanieblaCreate(AtrapanieblaBase): pass

class AtrapanieblaUpdate(AtrapanieblaBase):
    ubicacion_id: int | None = None
    codigo: str | None = None
    nombre: str | None = None
    area_malla_m2: Decimal | None = None
    estado_atrapaniebla_id: int | None = None

class AtrapanieblaResponse(AtrapanieblaBase):
    id: int
    creado_en: datetime
    model_config = ConfigDict(from_attributes=True)


# === FUENTES DE AGUA ===
class FuenteAguaBase(BaseModel):
    ubicacion_id: int | None = None
    tipo_fuente_agua_id: int
    codigo: str = Field(..., max_length=30)
    nombre: str = Field(..., max_length=100)
    descripcion: str | None = None
    capacidad_l: Decimal | None = Field(None, ge=0)
    estado_fuente_agua_id: int

class FuenteAguaCreate(FuenteAguaBase): pass

class FuenteAguaUpdate(FuenteAguaBase):
    tipo_fuente_agua_id: int | None = None
    codigo: str | None = None
    nombre: str | None = None
    estado_fuente_agua_id: int | None = None

class FuenteAguaResponse(FuenteAguaBase):
    id: int
    creado_en: datetime
    model_config = ConfigDict(from_attributes=True)


# === RELACIÓN FUENTE DE AGUA - ATRAPANIEBLA ===
class FuenteAguaAtrapanieblaBase(BaseModel):
    fuente_agua_id: int
    atrapaniebla_id: int

class FuenteAguaAtrapanieblaCreate(FuenteAguaAtrapanieblaBase):
    pass

class FuenteAguaAtrapanieblaResponse(FuenteAguaAtrapanieblaBase):
    id: int
    model_config = ConfigDict(from_attributes=True)