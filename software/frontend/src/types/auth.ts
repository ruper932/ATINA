export type TwoFactorMethod = 'totp' | 'email'

export type LoginPayload = {
  username: string
  password: string
}

export type AuthUserSummary = {
  ci: string
  username: string
  email: string
  is_totp_enabled: boolean
  is_email_2fa_enabled: boolean
}

export type LoginSuccessResponse = {
  access_token: string
  token_type: string
}

export type LoginRequires2FAResponse = {
  requires_2fa: true
  temp_token: string
  method: TwoFactorMethod
  message?: string | null
}

export type LoginResponse = LoginSuccessResponse | LoginRequires2FAResponse

export type Verify2FAPayload = {
  temp_token: string
  code: string
  method: TwoFactorMethod
  trust_device?: boolean
}

export type Verify2FAResponse = {
  access_token: string
  token_type: string
}

export type ToggleEmail2FAPayload = {
  enabled: boolean
  password_actual: string
}

export type MessageResponse = {
  message: string
}