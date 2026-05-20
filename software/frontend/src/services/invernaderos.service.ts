import { apiClient } from '@/lib/axios'
import type {
  InvernaderoCreatePayload,
  InvernaderoResponse,
  InvernaderoUpdatePayload,
} from '@/types/invernadero'

export const invernaderosService = {
  getAll: async (): Promise<InvernaderoResponse[]> => {
    const { data } = await apiClient.get<InvernaderoResponse[]>('/infra/invernaderos')
    return data
  },

  create: async (payload: InvernaderoCreatePayload): Promise<InvernaderoResponse> => {
    const { data } = await apiClient.post<InvernaderoResponse>('/infra/invernaderos', payload)
    return data
  },

  update: async (
    id: number,
    payload: InvernaderoUpdatePayload
  ): Promise<InvernaderoResponse> => {
    const { data } = await apiClient.put<InvernaderoResponse>(
      `/infra/invernaderos/${id}`,
      payload
    )
    return data
  },

  remove: async (id: number): Promise<InvernaderoResponse> => {
    const { data } = await apiClient.delete<InvernaderoResponse>(`/infra/invernaderos/${id}`)
    return data
  },
}