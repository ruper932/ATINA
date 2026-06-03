import { apiClient } from '@/lib/axios'
import type {
  LoginPayload,
  LoginResponse,
  MessageResponse,
  ToggleEmail2FAPayload,
  Verify2FAPayload,
  Verify2FAResponse,
} from '@/types/auth'

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const formData = new URLSearchParams()
    formData.append('username', payload.username)
    formData.append('password', payload.password)

    const { data } = await apiClient.post<LoginResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    return data
  },

  verify2FA: async (payload: Verify2FAPayload): Promise<Verify2FAResponse> => {
    const { data } = await apiClient.post<Verify2FAResponse>(
      '/auth/login/verify-2fa',
      payload
    )
    return data
  },

  toggleEmail2FA: async (payload: ToggleEmail2FAPayload): Promise<MessageResponse> => {
    const { data } = await apiClient.put<MessageResponse>('/auth/me/email-2fa', payload)
    return data
  },
}