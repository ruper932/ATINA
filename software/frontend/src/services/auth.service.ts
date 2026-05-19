import { apiClient } from '@/lib/axios'
import type {
  LoginPayload,
  LoginRequires2FAResponse,
  LoginSuccessResponse,
  MessageResponse,
  ToggleEmail2FAPayload,
  Verify2FAPayload,
  Verify2FAResponse,
} from '@/types/auth'

export const authService = {
  login: async (
    payload: LoginPayload
  ): Promise<LoginSuccessResponse | LoginRequires2FAResponse> => {
    const { data } = await apiClient.post('/auth/login', payload)
    return data
  },

  verify2FA: async (payload: Verify2FAPayload): Promise<Verify2FAResponse> => {
    const { data } = await apiClient.post('/auth/login/verify-2fa', payload)
    return data
  },

  toggleEmail2FA: async (payload: ToggleEmail2FAPayload): Promise<MessageResponse> => {
    const { data } = await apiClient.put('/auth/me/email-2fa', payload)
    return data
  },
}