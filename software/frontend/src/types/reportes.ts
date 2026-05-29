// src/types/reportes.ts
export interface VReporteLecturasSensor {
  lectura_id: number
  sensor_codigo: string
  sensor_nombre: string
  lectura_valor: string
  fecha_lectura: string
}

export interface VReporteAlertasInvernadero {
  alerta_id: number
  invernadero_id: number
  invernadero_nombre: string | null
  tipo_alerta: string
  mensaje: string
  fecha_generacion: string
}

export interface VReporteInventarioDispositivos {
  dispositivo_id: number
  codigo: string
  nombre: string
  tipo_dispositivo: string
  estado_dispositivo_id: number
  estado_dispositivo_nombre: string | null
}

export interface VReporteRiegoEjecutado {
  decision_id: number
  invernadero_id: number
  invernadero_nombre: string | null
  texto_decision: string
  inicio_evento: string
  duracion_segundos: number | null
}

export interface VReportePrediccionesAgua {
  prediccion_id: number
  fuente_agua: string
  modelo_usado: string
  fecha_objetivo: string
  volumen_predicho_l: string
}

export type ReportType =
  | 'lecturas'
  | 'alertas'
  | 'inventario'
  | 'riego'
  | 'predicciones'

export interface BaseFilters {
  skip: number
  limit: number
}

export interface LecturasFilters extends BaseFilters {
  q: string
  sensor_codigo: string
  sensor_nombre: string
  fecha_desde: string
  fecha_hasta: string
}

export interface AlertasFilters extends BaseFilters {
  q: string
  tipo_alerta: string
  mensaje: string
  invernadero_id: string
  fecha_desde: string
  fecha_hasta: string
}

export interface InventarioFilters extends BaseFilters {
  q: string
  codigo: string
  nombre: string
  tipo_dispositivo: string
  estado_dispositivo_id: string
}

export interface RiegoFilters extends BaseFilters {
  q: string
  invernadero_id: string
  texto_decision: string
  fecha_desde: string
  fecha_hasta: string
}

export interface PrediccionesFilters extends BaseFilters {
  q: string
  fuente_agua: string
  modelo_usado: string
  fecha_desde: string
  fecha_hasta: string
}

export const defaultLecturasFilters: LecturasFilters = {
  q: '',
  sensor_codigo: '',
  sensor_nombre: '',
  fecha_desde: '',
  fecha_hasta: '',
  skip: 0,
  limit: 100,
}

export const defaultAlertasFilters: AlertasFilters = {
  q: '',
  tipo_alerta: '',
  mensaje: '',
  invernadero_id: '',
  fecha_desde: '',
  fecha_hasta: '',
  skip: 0,
  limit: 100,
}

export const defaultInventarioFilters: InventarioFilters = {
  q: '',
  codigo: '',
  nombre: '',
  tipo_dispositivo: '',
  estado_dispositivo_id: '',
  skip: 0,
  limit: 100,
}

export const defaultRiegoFilters: RiegoFilters = {
  q: '',
  invernadero_id: '',
  texto_decision: '',
  fecha_desde: '',
  fecha_hasta: '',
  skip: 0,
  limit: 100,
}

export const defaultPrediccionesFilters: PrediccionesFilters = {
  q: '',
  fuente_agua: '',
  modelo_usado: '',
  fecha_desde: '',
  fecha_hasta: '',
  skip: 0,
  limit: 100,
}