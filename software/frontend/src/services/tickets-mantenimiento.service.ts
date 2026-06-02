// src/services/tickets-mantenimiento.service.ts
import { apiClient } from '@/lib/axios';
import type { 
  TicketMantenimiento, 
  TicketMantenimientoCreate, 
  TicketTomarRevision, 
  TicketResolver, 
  TicketCancelar 
} from '@/types/ticket-mantenimiento';

const BASE_URL = '/tickets';

export const ticketsMantenimientoService = {
  listar: async (params?: { 
    estado?: string; 
    tipo_recurso?: string;
    reportante_ci?: string;
    tecnico_ci?: string;
    skip?: number;
    limit?: number;
  }): Promise<TicketMantenimiento[]> => {
    const { data } = await apiClient.get(BASE_URL, { params });
    return data;
  },

  obtener: async (id: number): Promise<TicketMantenimiento> => {
    const { data } = await apiClient.get(`${BASE_URL}/${id}`);
    return data;
  },

  crear: async (payload: TicketMantenimientoCreate): Promise<TicketMantenimiento> => {
    const { data } = await apiClient.post(BASE_URL, payload);
    return data;
  },

  tomarRevision: async (id: number, payload: TicketTomarRevision): Promise<TicketMantenimiento> => {
    const { data } = await apiClient.patch(`${BASE_URL}/${id}/tomar`, payload);
    return data;
  },

  resolver: async (id: number, payload: TicketResolver): Promise<TicketMantenimiento> => {
    const { data } = await apiClient.patch(`${BASE_URL}/${id}/resolver`, payload);
    return data;
  },

  cancelar: async (id: number, payload: TicketCancelar): Promise<TicketMantenimiento> => {
    const { data } = await apiClient.patch(`${BASE_URL}/${id}/cancelar`, payload);
    return data;
  }
};