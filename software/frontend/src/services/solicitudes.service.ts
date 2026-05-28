import { apiClient } from "@/lib/axios";
import type {
  CancelarSolicitudPayload,
  CrearSolicitudPayload,
  ResolverSolicitudPayload,
  SolicitudMovimiento,
  SolicitudMovimientoDetail,
  SolicitudesQueryParams,
  TomarSolicitudPayload,
} from "@/types/solicitud";

const cleanParams = (params?: SolicitudesQueryParams) => {
  if (!params) return undefined;

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
};

export const solicitudesService = {
  getAll: async (params?: SolicitudesQueryParams): Promise<SolicitudMovimiento[]> => {
    const { data } = await apiClient.get<SolicitudMovimiento[]>("/solicitudes", {
      params: cleanParams(params),
    });
    return data;
  },

  getById: async (id: number): Promise<SolicitudMovimientoDetail> => {
    const { data } = await apiClient.get<SolicitudMovimientoDetail>(`/solicitudes/${id}`);
    return data;
  },

  create: async (payload: CrearSolicitudPayload): Promise<SolicitudMovimiento> => {
    const { data } = await apiClient.post<SolicitudMovimiento>("/solicitudes", payload);
    return data;
  },

  tomar: async (
    id: number,
    payload: TomarSolicitudPayload
  ): Promise<SolicitudMovimientoDetail> => {
    const { data } = await apiClient.patch<SolicitudMovimientoDetail>(
      `/solicitudes/${id}/tomar`,
      payload
    );
    return data;
  },

  resolver: async (
    id: number,
    payload: ResolverSolicitudPayload
  ): Promise<SolicitudMovimientoDetail> => {
    const { data } = await apiClient.patch<SolicitudMovimientoDetail>(
      `/solicitudes/${id}/resolver`,
      payload
    );
    return data;
  },

  cancelar: async (
    id: number,
    payload: CancelarSolicitudPayload
  ): Promise<SolicitudMovimientoDetail> => {
    const { data } = await apiClient.patch<SolicitudMovimientoDetail>(
      `/solicitudes/${id}/cancelar`,
      payload
    );
    return data;
  },
};