// src/services/atrapanieblas.service.ts
import { apiClient } from '@/lib/axios'
import type { 
  AtrapanieblaCreatePayload, 
  AtrapanieblaResponse, 
  AtrapanieblaUpdatePayload 
} from '@/types/atrapaniebla'

export const atrapanieblasService = {
  getAll: async (): Promise<AtrapanieblaResponse[]> => {
    const { data } = await apiClient.get('/infra/atrapanieblas')
    return data
  },

  create: async (payload: AtrapanieblaCreatePayload): Promise<AtrapanieblaResponse> => {
    const { data } = await apiClient.post('/infra/atrapanieblas', payload)
    return data
  },

  update: async (id: number, payload: AtrapanieblaUpdatePayload): Promise<AtrapanieblaResponse> => {
    const { data } = await apiClient.put(`/infra/atrapanieblas/${id}`, payload)
    return data
  },

  remove: async (id: number): Promise<AtrapanieblaResponse> => {
    const { data } = await apiClient.delete(`/infra/atrapanieblas/${id}`)
    return data
  },
}