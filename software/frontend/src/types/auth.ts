export type LoginPayload = {
  ci: string
  password: string
}

export type LoginSuccessResponse = {
  access_token: string
  token_type: string
  user: {
    ci: string
    username: string
    email: string
    is_totp_enabled: boolean
    is_email_2fa_enabled: boolean
  }
}

export type LoginRequires2FAResponse = {
  requires_2fa: true
  user_id: string
  method: 'totp' | 'email'
  message?: string
}

export type Verify2FAPayload = {
  user_id: string
  code: string
}

export type Verify2FAResponse = {
  access_token: string
  token_type: string
  user: {
    ci: string
    username: string
    email: string
    is_totp_enabled: boolean
    is_email_2fa_enabled: boolean
  }
}

export type ToggleEmail2FAPayload = {
  enabled: boolean
  password_actual: string
}

export type MessageResponse = {
  message: string
}