export type DispositivoBase = {
  tipo_dispositivo_id: number
  codigo: string
  nombre: string
  identificador_local?: string | null
  ip_local?: string | null
  version_firmware?: string | null
  estado_dispositivo_id: number
}

export type DispositivoCreatePayload = DispositivoBase

export type DispositivoUpdatePayload = Partial<DispositivoBase>

export type DispositivoResponse = DispositivoBase & {
  id: number
  ultima_conexion?: string | null
  creado_en: string
}