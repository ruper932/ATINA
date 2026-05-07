import { apiClient } from '@/lib/axios'
import type {
  PerfilPasswordPayload,
  PerfilResponse,
  PerfilUpdatePayload,
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

  changePassword: async (payload: PerfilPasswordPayload): Promise<{ message: string }> => {
    const { data } = await apiClient.put('/auth/me/password', payload)
    return data
  },
}