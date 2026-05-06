// types/invernadero.ts (Frontend)
export interface InvernaderoResponse {
  id: number
  ubicacion_id: number
  codigo: string
  nombre: string
  descripcion: string | null
  area_m2: number
  prioridad_riego: number
  estado_invernadero_id: number
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
  area_m2?: number
  estado_invernadero_id?: number
}