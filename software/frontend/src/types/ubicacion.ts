// src/types/ubicacion.ts

export interface UbicacionResponse {
  id: number
  tipo_ubicacion_id: number
  ubicacion_padre_id: number | null
  nombre: string
  descripcion: string | null
  latitud: number | null
  longitud: number | null
  altitud_m: number | null
  creado_en?: string
}

export interface UbicacionCreatePayload {
  tipo_ubicacion_id: number
  ubicacion_padre_id: number | null
  nombre: string
  descripcion: string | null
  latitud: number | null
  longitud: number | null
  altitud_m: number | null
}

export interface UbicacionUpdatePayload {
  tipo_ubicacion_id?: number
  ubicacion_padre_id?: number | null
  nombre?: string
  descripcion?: string | null
  latitud?: number | null
  longitud?: number | null
  altitud_m?: number | null
}