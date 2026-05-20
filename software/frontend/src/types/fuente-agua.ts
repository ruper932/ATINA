export type FuenteAguaResponse = {
  id: number
  ubicacion_id: number | null
  tipo_fuente_agua_id: number
  codigo: string
  nombre: string
  descripcion: string | null
  capacidad_l: number | null
  estado_fuente_agua_id: number
  creado_en: string
}

export type FuenteAguaCreatePayload = {
  ubicacion_id: number | null
  tipo_fuente_agua_id: number
  codigo: string
  nombre: string
  descripcion: string | null
  capacidad_l: number | null
  estado_fuente_agua_id: number
}

export type FuenteAguaUpdatePayload = FuenteAguaCreatePayload

export type TipoFuenteAguaResponse = {
  id: number
  nombre: string
  descripcion: string | null
}

export type EstadoFuenteAguaResponse = {
  id: number
  nombre: string
  descripcion: string | null
}

export type FuenteAguaAtrapanieblaResponse = {
  id: number
  fuente_agua_id: number
  atrapaniebla_id: number
}

export type FuenteAguaAtrapanieblaCreatePayload = {
  fuente_agua_id: number
  atrapaniebla_id: number
}

export type AtrapanieblaResponse = {
  id: number
  nombre: string
  codigo: string
}

export type UbicacionResponse = {
  id: number
  nombre: string
  descripcion?: string | null
}