export type PerfilResponse = {
  id: number
  email: string
  username: string
  is_active: boolean
  is_superuser: boolean
  rol_id: number | null
  estado_usuario_id: number | null
  is_totp_enabled: boolean
  is_email_2fa_enabled: boolean
  ultimo_acceso: string | null
  creado_en?: string | null
}

export type PerfilUpdatePayload = {
  email: string
  username: string
}

export type PerfilPasswordPayload = {
  password_actual: string
  password_nueva: string
}