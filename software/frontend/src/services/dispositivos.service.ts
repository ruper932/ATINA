import { apiClient } from '@/lib/axios'
import type { 
  DispositivoCreatePayload, 
  DispositivoResponse, 
  DispositivoUpdatePayload 
} from '@/types/dispositivo'

export const dispositivosService = {
  getAll: async (): Promise<DispositivoResponse[]> => {
    const { data } = await apiClient.get('/iot/') // <-- Actualizado a /iot/
    return data
  },

  getById: async (id: number): Promise<DispositivoResponse> => {
    const { data } = await apiClient.get(`/iot/${id}`) // <-- Actualizado a /iot/
    return data
  },

  create: async (payload: DispositivoCreatePayload): Promise<DispositivoResponse> => {
    const { data } = await apiClient.post('/iot/', payload) // <-- Actualizado a /iot/
    return data
  },

  update: async (id: number, payload: DispositivoUpdatePayload): Promise<DispositivoResponse> => {
    const { data } = await apiClient.put(`/iot/${id}`, payload) // <-- Actualizado a /iot/
    return data
  },

  remove: async (id: number): Promise<DispositivoResponse> => {
    const { data } = await apiClient.delete(`/iot/${id}`) // <-- Actualizado a /iot/
    return data
  }
}