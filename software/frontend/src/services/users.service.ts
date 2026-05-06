import { apiClient } from '@/lib/axios'
import type {
  UserCreatePayload,
  UserResponse,
  UserUpdatePayload,
  RolResponse,
  EstadoUsuarioResponse,
} from '@/types/user'

export const usersService = {
  getAll: async (): Promise<UserResponse[]> => {
    const { data } = await apiClient.get('/admin/')
    return data
  },

  getById: async (id: number): Promise<UserResponse> => {
    const { data } = await apiClient.get(`/admin/${id}`)
    return data
  },

  create: async (payload: UserCreatePayload): Promise<UserResponse> => {
    const { data } = await apiClient.post('/admin/', payload)
    return data
  },

  update: async (id: number, payload: UserUpdatePayload): Promise<UserResponse> => {
    const { data } = await apiClient.put(`/admin/${id}`, payload)
    return data
  },

  remove: async (id: number): Promise<UserResponse> => {
    const { data } = await apiClient.delete(`/admin/${id}`)
    return data
  },

  getRoles: async (): Promise<RolResponse[]> => {
    const { data } = await apiClient.get('/admin/roles')
    return data
  },

  getEstados: async (): Promise<EstadoUsuarioResponse[]> => {
    const { data } = await apiClient.get('/admin/estados')
    return data
  },
}