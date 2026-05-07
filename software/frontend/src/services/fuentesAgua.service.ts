// src/services/fuentesAgua.service.ts
import { apiClient } from '@/lib/axios'
import type {
  AtrapanieblaResponse,
  EstadoFuenteAguaResponse,
  FuenteAguaAtrapanieblaCreatePayload,
  FuenteAguaAtrapanieblaResponse,
  FuenteAguaCreatePayload,
  FuenteAguaResponse,
  FuenteAguaUpdatePayload,
  TipoFuenteAguaResponse,
} from '@/types/fuente-agua'

export const fuentesAguaService = {
  getAll: async (): Promise<FuenteAguaResponse[]> => {
    const { data } = await apiClient.get('/infra/fuentes-agua')
    return data
  },

  getById: async (id: number): Promise<FuenteAguaResponse> => {
    const { data } = await apiClient.get(`/infra/fuentes-agua/${id}`)
    return data
  },

  create: async (payload: FuenteAguaCreatePayload): Promise<FuenteAguaResponse> => {
    const { data } = await apiClient.post('/infra/fuentes-agua', payload)
    return data
  },

  update: async (
    id: number,
    payload: FuenteAguaUpdatePayload
  ): Promise<FuenteAguaResponse> => {
    const { data } = await apiClient.put(`/infra/fuentes-agua/${id}`, payload)
    return data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/infra/fuentes-agua/${id}`)
  },

  getTipos: async (): Promise<TipoFuenteAguaResponse[]> => {
    const { data } = await apiClient.get('/infra/catalogos/tipos-fuente-agua')
    return data
  },

  getEstados: async (): Promise<EstadoFuenteAguaResponse[]> => {
    const { data } = await apiClient.get('/infra/catalogos/estados-fuente-agua')
    return data
  },

  getAtrapanieblas: async (): Promise<AtrapanieblaResponse[]> => {
    const { data } = await apiClient.get('/infra/atrapanieblas')
    return data
  },

  getRelaciones: async (): Promise<FuenteAguaAtrapanieblaResponse[]> => {
    const { data } = await apiClient.get('/infra/fuentes-agua-atrapanieblas')
    return data
  },

  createRelacion: async (
    payload: FuenteAguaAtrapanieblaCreatePayload
  ): Promise<FuenteAguaAtrapanieblaResponse> => {
    const { data } = await apiClient.post('/infra/fuentes-agua-atrapanieblas', payload)
    return data
  },

  removeRelacion: async (id: number): Promise<void> => {
    await apiClient.delete(`/infra/fuentes-agua-atrapanieblas/${id}`)
  },
}