// src/services/ubicaciones.service.ts
import { apiClient } from '@/lib/axios' // Tu instancia de Axios configurada
import type { 
  UbicacionCreatePayload, 
  UbicacionResponse, 
  UbicacionUpdatePayload 
} from '@/types/ubicacion'

export const ubicacionesService = {
  getAll: async (): Promise<UbicacionResponse[]> => {
    const { data } = await apiClient.get('/infra/ubicaciones')
    return data
  },

  create: async (payload: UbicacionCreatePayload): Promise<UbicacionResponse> => {
    const { data } = await apiClient.post('/infra/ubicaciones', payload)
    return data
  },

  update: async (id: number, payload: UbicacionUpdatePayload): Promise<UbicacionResponse> => {
    const { data } = await apiClient.put(`/infra/ubicaciones/${id}`, payload)
    return data
  },

  remove: async (id: number): Promise<UbicacionResponse> => {
    const { data } = await apiClient.delete(`/infra/ubicaciones/${id}`)
    return data
  },
}