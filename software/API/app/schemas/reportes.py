# app/schemas/reportes.py
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# =========================================================
# BASE
# =========================================================

class ORMBaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# =========================================================
# SINCRONIZACIONES MCP
# =========================================================

class SincronizacionMCPBase(BaseModel):
    estado_sincronizacion_id: int = Field(..., ge=1)
    dispositivo_id: int | None = Field(default=None, ge=1)
    origen: str = Field(..., min_length=1, max_length=50)
    destino: str = Field(..., min_length=1, max_length=50)
    tipo_recurso: str = Field(..., min_length=1, max_length=50)
    cantidad_registros: int = Field(default=0, ge=0)
    fecha_fin: datetime | None = None
    mensaje_resultado: str | None = Field(default=None, max_length=500)


class SincronizacionMCPCreate(SincronizacionMCPBase):
    pass


class SincronizacionMCPUpdate(BaseModel):
    estado_sincronizacion_id: int | None = Field(default=None, ge=1)
    dispositivo_id: int | None = Field(default=None, ge=1)
    origen: str | None = Field(default=None, min_length=1, max_length=50)
    destino: str | None = Field(default=None, min_length=1, max_length=50)
    tipo_recurso: str | None = Field(default=None, min_length=1, max_length=50)
    cantidad_registros: int | None = Field(default=None, ge=0)
    fecha_fin: datetime | None = None
    mensaje_resultado: str | None = Field(default=None, max_length=500)


class SincronizacionMCPResponse(SincronizacionMCPBase, ORMBaseSchema):
    id: int
    fecha_inicio: datetime
    estado_sincronizacion_nombre: str | None = None
    dispositivo_codigo: str | None = None
    dispositivo_nombre: str | None = None


# =========================================================
# VISTAS PARA REPORTES
# =========================================================

class VReporteLecturasSensorResponse(ORMBaseSchema):
    lectura_id: int
    sensor_codigo: str
    sensor_nombre: str
    lectura_valor: Decimal
    fecha_lectura: datetime


class VReporteAlertasInvernaderoResponse(ORMBaseSchema):
    alerta_id: int
    invernadero_id: int
    invernadero_nombre: str | None = None
    tipo_alerta: str
    mensaje: str
    fecha_generacion: datetime


class VReporteInventarioDispositivosResponse(ORMBaseSchema):
    dispositivo_id: int
    codigo: str
    nombre: str
    tipo_dispositivo: str
    estado_dispositivo_id: int
    estado_dispositivo_nombre: str | None = None


class VReporteRiegoEjecutadoResponse(ORMBaseSchema):
    decision_id: int
    invernadero_id: int
    invernadero_nombre: str | None = None
    texto_decision: str
    inicio_evento: datetime
    duracion_segundos: int | None = Field(default=None, ge=0)


class VReportePrediccionesAguaResponse(ORMBaseSchema):
    prediccion_id: int
    fuente_agua: str
    modelo_usado: str
    fecha_objetivo: date
    volumen_predicho_l: Decimal


# =========================================================
# ESTADOS DE SINCRONIZACIÓN
# =========================================================

class EstadoSincronizacionBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=30)
    descripcion: str | None = Field(default=None, max_length=255)


class EstadoSincronizacionCreate(EstadoSincronizacionBase):
    pass


class EstadoSincronizacionUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=30)
    descripcion: str | None = Field(default=None, max_length=255)


class EstadoSincronizacionResponse(EstadoSincronizacionBase, ORMBaseSchema):
    id: int


# =========================================================
# REPORTES SEMANALES
# =========================================================

class ReporteSemanalBase(BaseModel):
    periodo_inicio: date
    periodo_fin: date
    volumen_captado_l: Decimal = Field(default=Decimal("0.0"))
    volumen_predicho_l: Decimal = Field(default=Decimal("0.0"))
    eficiencia_riego: Decimal | None = None
    total_alertas: int = Field(default=0, ge=0)
    resumen: str | None = Field(default=None, max_length=2000)
    generado_por_ci: str | None = Field(default=None, min_length=1, max_length=20)


class ReporteSemanalCreate(ReporteSemanalBase):
    pass


class ReporteSemanalUpdate(BaseModel):
    periodo_inicio: date | None = None
    periodo_fin: date | None = None
    volumen_captado_l: Decimal | None = None
    volumen_predicho_l: Decimal | None = None
    eficiencia_riego: Decimal | None = None
    total_alertas: int | None = Field(default=None, ge=0)
    resumen: str | None = Field(default=None, max_length=2000)
    generado_por_ci: str | None = Field(default=None, min_length=1, max_length=20)


class ReporteSemanalResponse(ReporteSemanalBase, ORMBaseSchema):
    id: int
    fecha_generacion: datetime