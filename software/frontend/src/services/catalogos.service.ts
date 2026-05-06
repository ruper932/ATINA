// src/services/catalogos.service.ts
import { apiClient } from '@/lib/axios'

export interface TipoUbicacion {
  id: number
  nombre: string
  descripcion: string | null
}
export interface CatalogoBasico {
  id: number
  nombre: string
  descripcion: string | null
}
export interface TipoSensor {
  id: number
  nombre: string
  descripcion: string | null
  unidad_base: string // Ej: °C, %, mm
}
export type CatalogoResponse = {
  id: number
  nombre: string
  descripcion?: string | null
}


export const catalogosService = {
  getTiposUbicacion: async (): Promise<TipoUbicacion[]> => {
    // Fíjate que le agregué "infra/"
    const { data } = await apiClient.get('/infra/catalogos/tipos-ubicacion')
    return data
  },
    getEstadosAtrapaniebla: async (): Promise<CatalogoBasico[]> => {
        const { data } = await apiClient.get('/infra/catalogos/estados-atrapaniebla')
        return data
    },
    getTiposSensor: async (): Promise<TipoSensor[]> => {
    const { data } = await apiClient.get('/iot/catalogos/tipos-sensor')
    return data
  },
  getEstadosSensor: async (): Promise<CatalogoBasico[]> => {
    const { data } = await apiClient.get('/iot/catalogos/estados-sensor')
    return data
  },
  getTiposDispositivo: async (): Promise<CatalogoResponse[]> => {
    // Si esta ruta no existe en tu Swagger, debes crearla en tu router de IoT
    const { data } = await apiClient.get('/iot/catalogos/tipos-dispositivo')
    return data
  },
  
  getEstadosDispositivo: async (): Promise<CatalogoResponse[]> => {
    // Si esta ruta no existe en tu Swagger, debes crearla en tu router de IoT
    const { data } = await apiClient.get('/iot/catalogos/estados-dispositivo')
    return data
  },

  
}

