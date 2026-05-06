// src/services/reportes.service.ts
import { apiClient } from '@/lib/axios'
import {
  VReporteLecturasSensor,
  VReporteAlertasInvernadero,
  VReporteInventarioDispositivos,
  VReporteRiegoEjecutado,
  VReportePrediccionesAgua
} from '../types/reportes';

export const reportesService = {
  getLecturasSensor: async () => {
    const { data } = await apiClient.get<VReporteLecturasSensor[]>('/reportes/vistas/lecturas-sensor');
    return data;
  },
  getAlertasInvernadero: async () => {
    const { data } = await apiClient.get<VReporteAlertasInvernadero[]>('/reportes/vistas/alertas-invernadero');
    return data;
  },
  getInventarioDispositivos: async () => {
    const { data } = await apiClient.get<VReporteInventarioDispositivos[]>('/reportes/vistas/inventario-dispositivos');
    return data;
  },
  getRiegoEjecutado: async () => {
    const { data } = await apiClient.get<VReporteRiegoEjecutado[]>('/reportes/vistas/riego-ejecutado');
    return data;
  },
  getPrediccionesAgua: async () => {
    const { data } = await apiClient.get<VReportePrediccionesAgua[]>('/reportes/vistas/predicciones-agua');
    return data;
  }
};