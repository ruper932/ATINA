# app/schemas/dispositivos.py
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, IPvAnyAddress

# === DISPOSITIVOS ===
class DispositivoBase(BaseModel):
    tipo_dispositivo_id: int
    codigo: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=100)
    identificador_local: str | None = Field(None, max_length=100)
    ip_local: IPvAnyAddress | None = None
    version_firmware: str | None = Field(None, max_length=50)
    estado_dispositivo_id: int

class DispositivoCreate(DispositivoBase): pass

class DispositivoUpdate(DispositivoBase):
    tipo_dispositivo_id: int | None = None
    codigo: str | None = None
    nombre: str | None = None
    estado_dispositivo_id: int | None = None

class DispositivoResponse(DispositivoBase):
    id: int
    ultima_conexion: datetime | None = None
    creado_en: datetime
    # Convertimos IPvAnyAddress a str para la serialización final
    ip_local: str | None = None 

    model_config = ConfigDict(from_attributes=True)


# === SENSORES ===
class SensorBase(BaseModel):
    dispositivo_id: int
    tipo_sensor_id: int
    codigo: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=100)
    modelo: str | None = Field(None, max_length=50)
    numero_serie: str | None = Field(None, max_length=100)
    precision_valor: Decimal | None = None
    estado_sensor_id: int
    fecha_instalacion: date | None = None

class SensorCreate(SensorBase): pass

class SensorUpdate(SensorBase):
    dispositivo_id: int | None = None
    tipo_sensor_id: int | None = None
    codigo: str | None = None
    nombre: str | None = None
    estado_sensor_id: int | None = None

class SensorResponse(SensorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# === LECTURAS DE SENSOR ===
class LecturaSensorBase(BaseModel):
    sensor_id: int
    valor: Decimal = Field(..., max_digits=14, decimal_places=4)
    calidad_dato_id: int
    timestamp_lectura: datetime
    metadatos_json: dict | None = None

class LecturaSensorCreate(LecturaSensorBase): pass

class LecturaSensorResponse(LecturaSensorBase):
    id: int
    timestamp_recepcion: datetime
    model_config = ConfigDict(from_attributes=True)


# === ACTUADORES ===
class ActuadorBase(BaseModel):
    dispositivo_id: int
    tipo_actuador_id: int
    codigo: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=100)
    estado_actuador_id: int
    fecha_instalacion: date | None = None

class ActuadorCreate(ActuadorBase): pass

class ActuadorUpdate(ActuadorBase):
    dispositivo_id: int | None = None
    tipo_actuador_id: int | None = None
    codigo: str | None = None
    nombre: str | None = None
    estado_actuador_id: int | None = None

class ActuadorResponse(ActuadorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)