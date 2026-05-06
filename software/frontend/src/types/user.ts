export type UserResponse = {
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
  created_at: string
  updated_at: string
}

export type UserCreatePayload = {
  email: string
  username: string
  password: string
  is_active: boolean
  is_superuser: boolean
  rol_id: number | null
  estado_usuario_id: number | null
  is_totp_enabled: boolean
  is_email_2fa_enabled: boolean
}

export type UserUpdatePayload = {
  email?: string
  username?: string
  password?: string | null
  is_active?: boolean
  is_superuser?: boolean
  rol_id?: number | null
  estado_usuario_id?: number | null
  is_totp_enabled?: boolean
  is_email_2fa_enabled?: boolean
}

export type RolResponse = {
  id: number
  nombre: string
  descripcion: string | null
}

export type RolCreatePayload = {
  nombre: string
  descripcion: string | null
}

export type RolUpdatePayload = {
  nombre?: string
  descripcion?: string | null
}
export type EstadoUsuarioResponse = {
  id: number
  nombre: string
  descripcion: string | null
}

