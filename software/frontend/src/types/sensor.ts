export type SensorBase = {
  dispositivo_id: number
  tipo_sensor_id: number
  codigo: string
  nombre: string
  modelo?: string | null
  numero_serie?: string | null
  precision_valor?: number | null
  estado_sensor_id: number
  fecha_instalacion?: string | null
}

export type SensorCreatePayload = SensorBase

export type SensorUpdatePayload = Partial<SensorBase>

export type SensorResponse = {
  id: number
  dispositivo_id: number
  tipo_sensor_id: number
  codigo: string
  nombre: string
  modelo: string | null
  numero_serie: string | null
  precision_valor: number | null
  estado_sensor_id: number
  fecha_instalacion: string | null
  dispositivo_nombre?: string | null
  tipo_sensor_nombre?: string | null
  estado_sensor_nombre?: string | null
}