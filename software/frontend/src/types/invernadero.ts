export type InvernaderoResponse = {
  id: number
  ubicacion_id: number
  ubicacion_nombre?: string | null
  codigo: string
  nombre: string
  descripcion?: string | null
  area_m2: number | string
  prioridad_riego: number
  estado_invernadero_id: number
  estado_invernadero_nombre?: string | null
  creado_en: string
}

export interface InvernaderoCreatePayload {
  ubicacion_id: number
  codigo: string
  nombre: string
  descripcion: string | null
  area_m2: number
  prioridad_riego: number
  estado_invernadero_id: number
}

export interface InvernaderoUpdatePayload {
  ubicacion_id?: number
  codigo?: string
  nombre?: string
  descripcion?: string | null
  area_m2?: number
  prioridad_riego?: number
  estado_invernadero_id?: number
}