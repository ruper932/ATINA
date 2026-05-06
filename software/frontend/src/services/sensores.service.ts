import { apiClient } from '@/lib/axios'
import type { 
  SensorCreatePayload, 
  SensorResponse, 
  SensorUpdatePayload 
} from '@/types/sensor'

export const sensoresService = {
  getAll: async (): Promise<SensorResponse[]> => {
    const { data } = await apiClient.get('/iot/sensores')
    return data
  },

  getById: async (id: number): Promise<SensorResponse> => {
    const { data } = await apiClient.get(`/iot/sensores/${id}`)
    return data
  },

  create: async (payload: SensorCreatePayload): Promise<SensorResponse> => {
    const { data } = await apiClient.post('/iot/sensores', payload)
    return data
  },

  update: async (id: number, payload: SensorUpdatePayload): Promise<SensorResponse> => {
    const { data } = await apiClient.put(`/iot/sensores/${id}`, payload)
    return data
  },

  // Tu backend no tiene ruta de DELETE en sensores en el Swagger,
  // pero la dejamos lista por si la añades después o la omites.
  remove: async (id: number): Promise<SensorResponse> => {
    const { data } = await apiClient.delete(`/iot/sensores/${id}`)
    return data
  }
}