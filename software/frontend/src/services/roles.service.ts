import { apiClient } from '@/lib/axios'
import type { RolCreatePayload, RolResponse, RolUpdatePayload } from '@/types/user'

export const rolesService = {
  getAll: async (): Promise<RolResponse[]> => {
    const { data } = await apiClient.get('/admin/roles')
    return data
  },

  create: async (payload: RolCreatePayload): Promise<RolResponse> => {
    const { data } = await apiClient.post('/admin/roles', payload)
    return data
  },

  update: async (id: number, payload: RolUpdatePayload): Promise<RolResponse> => {
    const { data } = await apiClient.put(`/admin/roles/${id}`, payload)
    return data
  },
}