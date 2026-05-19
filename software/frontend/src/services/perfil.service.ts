import { apiClient } from '@/lib/axios'
import type {
  DisableTOTPRequest,
  MessageResponse,
  PerfilPasswordPayload,
  PerfilResponse,
  PerfilUpdatePayload,
  SetupTOTPResponse,
} from '@/types/perfil'

export const perfilService = {
  getMe: async (): Promise<PerfilResponse> => {
    const { data } = await apiClient.get('/auth/me')
    return data
  },

  updateMe: async (payload: PerfilUpdatePayload): Promise<PerfilResponse> => {
    const { data } = await apiClient.put('/auth/me', payload)
    return data
  },

  changePassword: async (payload: PerfilPasswordPayload): Promise<MessageResponse> => {
    const { data } = await apiClient.put('/auth/me/password', payload)
    return data
  },

  setupTOTP: async (): Promise<SetupTOTPResponse> => {
    const { data } = await apiClient.post('/auth/2fa/setup-totp')
    return data
  },

  enableTOTP: async (code: string): Promise<MessageResponse> => {
    const formData = new FormData()
    formData.append('code', code)

    const { data } = await apiClient.post('/auth/2fa/enable-totp', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  disableTOTP: async (payload: DisableTOTPRequest): Promise<MessageResponse> => {
    const { data } = await apiClient.post('/auth/2fa/disable-totp', payload)
    return data
  },
}