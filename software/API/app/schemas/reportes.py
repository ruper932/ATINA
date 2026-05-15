from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


# === SINCRONIZACIONES MCP ===
class SincronizacionMCPBase(BaseModel):
    estado_sincronizacion_id: int
    dispositivo_id: int | None = None
    origen: str = Field(..., max_length=50)
    destino: str = Field(..., max_length=50)
    tipo_recurso: str = Field(..., max_length=50)
    cantidad_registros: int = Field(default=0, ge=0)
    fecha_fin: datetime | None = None
    mensaje_resultado: str | None = None


class SincronizacionMCPCreate(SincronizacionMCPBase):
    pass


class SincronizacionMCPUpdate(BaseModel):
    estado_sincronizacion_id: int | None = None
    cantidad_registros: int | None = None
    fecha_fin: datetime | None = None
    mensaje_resultado: str | None = None


class SincronizacionMCPResponse(SincronizacionMCPBase):
    id: int
    fecha_inicio: datetime
    model_config = ConfigDict(from_attributes=True)


# === VISTAS PARA REPORTES ===
class VReporteLecturasSensorResponse(BaseModel):
    lectura_id: int
    sensor_codigo: str
    sensor_nombre: str
    lectura_valor: Decimal
    fecha_lectura: datetime
    model_config = ConfigDict(from_attributes=True)


class VReporteAlertasInvernaderoResponse(BaseModel):
    alerta_id: int
    invernadero_id: int
    tipo_alerta: str
    mensaje: str
    fecha_generacion: datetime
    model_config = ConfigDict(from_attributes=True)


class VReporteInventarioDispositivosResponse(BaseModel):
    dispositivo_id: int
    codigo: str
    nombre: str
    tipo_dispositivo: str
    estado_dispositivo_id: int
    model_config = ConfigDict(from_attributes=True)


class VReporteRiegoEjecutadoResponse(BaseModel):
    decision_id: int
    invernadero_id: int
    texto_decision: str
    inicio_evento: datetime
    duracion_segundos: int | None
    model_config = ConfigDict(from_attributes=True)


class VReportePrediccionesAguaResponse(BaseModel):
    prediccion_id: int
    fuente_agua: str
    modelo_usado: str
    fecha_objetivo: date
    volumen_predicho_l: Decimal
    model_config = ConfigDict(from_attributes=True)


# === ESTADOS DE SINCRONIZACIÓN ===
class EstadoSincronizacionBase(BaseModel):
    nombre: str = Field(..., max_length=30)
    descripcion: str | None = None


class EstadoSincronizacionCreate(EstadoSincronizacionBase):
    pass


class EstadoSincronizacionUpdate(BaseModel):
    nombre: str | None = Field(None, max_length=30)
    descripcion: str | None = None


class EstadoSincronizacionResponse(EstadoSincronizacionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# === REPORTES SEMANALES ===
class ReporteSemanalBase(BaseModel):
    periodo_inicio: date
    periodo_fin: date
    volumen_captado_l: Decimal = Field(default=Decimal("0.0"))
    volumen_predicho_l: Decimal = Field(default=Decimal("0.0"))
    eficiencia_riego: Decimal | None = None
    total_alertas: int = Field(default=0, ge=0)
    resumen: str | None = None
    generado_por_ci: str | None = None


class ReporteSemanalCreate(ReporteSemanalBase):
    pass


class ReporteSemanalUpdate(BaseModel):
    volumen_captado_l: Decimal | None = None
    volumen_predicho_l: Decimal | None = None
    eficiencia_riego: Decimal | None = None
    total_alertas: int | None = None
    resumen: str | None = None


class ReporteSemanalResponse(ReporteSemanalBase):
    id: int
    fecha_generacion: datetime
    model_config = ConfigDict(from_attributes=True)