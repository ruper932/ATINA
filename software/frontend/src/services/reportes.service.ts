// src/services/reportes.service.ts
import { apiClient } from '@/lib/axios'
import type {
  AlertasFilters,
  InventarioFilters,
  LecturasFilters,
  PrediccionesFilters,
  RiegoFilters,
  VReporteAlertasInvernadero,
  VReporteInventarioDispositivos,
  VReporteLecturasSensor,
  VReportePrediccionesAgua,
  VReporteRiegoEjecutado,
} from '@/types/reportes'

type ExportableParams = {
  export_all?: boolean
}

type LecturasQueryParams = Partial<LecturasFilters> & ExportableParams
type AlertasQueryParams = Partial<AlertasFilters> & ExportableParams
type InventarioQueryParams = Partial<InventarioFilters> & ExportableParams
type RiegoQueryParams = Partial<RiegoFilters> & ExportableParams
type PrediccionesQueryParams = Partial<PrediccionesFilters> & ExportableParams

const cleanParams = <T extends Record<string, unknown>>(params?: Partial<T>) => {
  if (!params) return {}

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null) return false
      if (typeof value === 'string' && value.trim() === '') return false
      return true
    })
  )
}

export const reportesService = {
  getLecturasSensor: async (params?: LecturasQueryParams) => {
    const { data } = await apiClient.get<VReporteLecturasSensor[]>(
      '/reportes/vistas/lecturas-sensor',
      { params: cleanParams(params) }
    )
    return data
  },

  getLecturasSensorAll: async (params?: Partial<LecturasFilters>) => {
    const { data } = await apiClient.get<VReporteLecturasSensor[]>(
      '/reportes/vistas/lecturas-sensor',
      {
        params: cleanParams({
          ...params,
          export_all: true,
        }),
      }
    )
    return data
  },

  getAlertasInvernadero: async (params?: AlertasQueryParams) => {
    const { data } = await apiClient.get<VReporteAlertasInvernadero[]>(
      '/reportes/vistas/alertas-invernadero',
      { params: cleanParams(params) }
    )
    return data
  },

  getAlertasInvernaderoAll: async (params?: Partial<AlertasFilters>) => {
    const { data } = await apiClient.get<VReporteAlertasInvernadero[]>(
      '/reportes/vistas/alertas-invernadero',
      {
        params: cleanParams({
          ...params,
          export_all: true,
        }),
      }
    )
    return data
  },

  getInventarioDispositivos: async (params?: InventarioQueryParams) => {
    const { data } = await apiClient.get<VReporteInventarioDispositivos[]>(
      '/reportes/vistas/inventario-dispositivos',
      { params: cleanParams(params) }
    )
    return data
  },

  getInventarioDispositivosAll: async (params?: Partial<InventarioFilters>) => {
    const { data } = await apiClient.get<VReporteInventarioDispositivos[]>(
      '/reportes/vistas/inventario-dispositivos',
      {
        params: cleanParams({
          ...params,
          export_all: true,
        }),
      }
    )
    return data
  },

  getRiegoEjecutado: async (params?: RiegoQueryParams) => {
    const { data } = await apiClient.get<VReporteRiegoEjecutado[]>(
      '/reportes/vistas/riego-ejecutado',
      { params: cleanParams(params) }
    )
    return data
  },

  getRiegoEjecutadoAll: async (params?: Partial<RiegoFilters>) => {
    const { data } = await apiClient.get<VReporteRiegoEjecutado[]>(
      '/reportes/vistas/riego-ejecutado',
      {
        params: cleanParams({
          ...params,
          export_all: true,
        }),
      }
    )
    return data
  },

  getPrediccionesAgua: async (params?: PrediccionesQueryParams) => {
    const { data } = await apiClient.get<VReportePrediccionesAgua[]>(
      '/reportes/vistas/predicciones-agua',
      { params: cleanParams(params) }
    )
    return data
  },

  getPrediccionesAguaAll: async (params?: Partial<PrediccionesFilters>) => {
    const { data } = await apiClient.get<VReportePrediccionesAgua[]>(
      '/reportes/vistas/predicciones-agua',
      {
        params: cleanParams({
          ...params,
          export_all: true,
        }),
      }
    )
    return data
  },
}