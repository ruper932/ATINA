export type TipoRecursoSolicitud = "atrapaniebla" | "fuenteagua";

export type EstadoSolicitud =
  | "pendiente"
  | "en_revision"
  | "aprobada"
  | "rechazada"
  | "cancelada";

export interface HistorialSolicitud {
  id: number;
  solicitud_id: number;
  estado_anterior: EstadoSolicitud | null;
  estado_nuevo: EstadoSolicitud;
  actor_ci: string | null;
  comentario: string | null;
  pdf_url: string | null;
  creado_en: string;
}

export interface SolicitudMovimiento {
  id: number;
  tipo_recurso: TipoRecursoSolicitud;
  recurso_id: number;
  solicitante_ci: string;
  revisor_ci: string | null;
  ubicacion_origen_id: number;
  ubicacion_destino_id: number | null;
  ubicacion_destino_propuesta: string | null;
  motivo: string;
  observacion: string | null;
  pdf_url: string | null;
  estado: EstadoSolicitud;
  fecha_creacion: string;
  fecha_revision: string | null;
  fecha_resolucion: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface SolicitudMovimientoDetail extends SolicitudMovimiento {
  historial: HistorialSolicitud[];
}

export interface CrearSolicitudPayload {
  tipo_recurso: TipoRecursoSolicitud;
  recurso_id: number;
  ubicacion_destino_id?: number | null;
  ubicacion_destino_propuesta?: string | null;
  motivo: string;
  pdf_url?: string | null;
}

export interface TomarSolicitudPayload {
  comentario?: string;
}

export interface ResolverSolicitudPayload {
  aprobar: boolean;
  observacion: string;
  ubicacion_destino_id?: number | null;
  pdf_url?: string | null;
}

export interface CancelarSolicitudPayload {
  comentario?: string;
}

export interface SolicitudesQueryParams {
  estado?: EstadoSolicitud;
  solicitante_ci?: string;
  revisor_ci?: string;
  skip?: number;
  limit?: number;
}

export type SolicitudesListResponse = SolicitudMovimiento[];
export type SolicitudDetailResponse = SolicitudMovimientoDetail;