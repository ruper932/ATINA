// services/invernaderos.service.ts (Frontend)
import { apiClient } from '@/lib/axios'
import type { 
  InvernaderoCreatePayload, 
  InvernaderoResponse, 
  InvernaderoUpdatePayload 
} from '@/types/invernadero'

export const invernaderosService = {
  getAll: async (): Promise<InvernaderoResponse[]> => {
    // Apunta al endpoint exacto que definiste en app/api/routes/infraestructura.py
    const { data } = await apiClient.get('/infra/invernaderos')
    return data
  },

  create: async (payload: InvernaderoCreatePayload): Promise<InvernaderoResponse> => {
    const { data } = await apiClient.post('/infra/invernaderos', payload)
    return data
  },

  update: async (id: number, payload: InvernaderoUpdatePayload): Promise<InvernaderoResponse> => {
    const { data } = await apiClient.put(`/infra/invernaderos/${id}`, payload)
    return data
  },

  remove: async (id: number): Promise<InvernaderoResponse> => {
    const { data } = await apiClient.delete(`/infra/invernaderos/${id}`)
    return data
  },
}