// src/types/atrapaniebla.ts
export interface AtrapanieblaResponse {
  id: number
  ubicacion_id: number
  codigo: string
  nombre: string
  area_malla_m2: number
  tipo_malla: string | null
  orientacion: string | null
  estado_atrapaniebla_id: number
  fecha_instalacion: string | null
  creado_en?: string
}

export interface AtrapanieblaCreatePayload {
  ubicacion_id: number
  codigo: string
  nombre: string
  area_malla_m2: number
  tipo_malla: string | null
  orientacion: string | null
  estado_atrapaniebla_id: number
  fecha_instalacion: string | null
}

export interface AtrapanieblaUpdatePayload {
  ubicacion_id?: number
  codigo?: string
  nombre?: string
  area_malla_m2?: number
  estado_atrapaniebla_id?: number
  tipo_malla?: string | null
  orientacion?: string | null
  fecha_instalacion?: string | null
}