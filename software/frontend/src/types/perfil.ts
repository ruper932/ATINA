export type PerfilResponse = {
  ci: string
  email: string
  username: string
  is_active: boolean
  is_superuser: boolean
  rol_id: number | null
  rol_nombre: string | null
  estado_usuario_id: number | null
  estado_usuario_nombre: string | null
  is_totp_enabled: boolean
  is_email_2fa_enabled: boolean
  ultimo_acceso: string | null
  created_at?: string
  updated_at?: string

  nombres: string | null
  apellido_paterno: string | null
  apellido_materno: string | null
  telefono: string | null
  cargo: string | null
  foto_url: string | null
  bio: string | null
}

export type PerfilUpdatePayload = {
  email: string
  username: string
  password_actual: string
  nombres: string
  apellido_paterno: string
  apellido_materno?: string | null
  telefono?: string | null
  cargo?: string | null
  bio?: string | null
  foto_url?: string | null
}

export type PerfilPasswordPayload = {
  password_actual: string
  password_nueva: string
}

export type SetupTOTPResponse = {
  secret: string
  uri: string
}

export type DisableTOTPRequest = {
  password: string
  code: string
}

export type MessageResponse = {
  message: string
}