export type TipoRecursoTicket = 'dispositivo' | 'sensor' | 'actuador';
export type EstadoTicket = 'pendiente' | 'en_revision' | 'terminado' | 'cancelado';
export type ResultadoRevision = 'danado' | 'mantenimiento' | 'sin_falla';

export interface HistorialTicket {
  id: number;
  ticket_id: number;
  estado_anterior: EstadoTicket | null;
  estado_nuevo: EstadoTicket;
  actor_ci: string | null;
  comentario: string | null;
  creado_en: string;
}

export interface TicketMantenimiento {
  id: number;
  tipo_recurso: TipoRecursoTicket;
  recurso_id: number;
  reportante_ci: string;
  tecnico_ci: string | null;
  descripcion_problema: string;
  observacion_tecnica: string | null;
  estado: EstadoTicket;
  resultado_revision: ResultadoRevision | null;
  fecha_reporte: string;
  fecha_toma: string | null;
  fecha_cierre: string | null;
  creado_en: string;
  actualizado_en: string;
  historial: HistorialTicket[];
}

export interface TicketMantenimientoCreate {
  tipo_recurso: TipoRecursoTicket;
  recurso_id: number;
  descripcion_problema: string;
}

export interface TicketTomarRevision {
  comentario?: string;
}

export interface TicketResolver {
  resultado_revision: ResultadoRevision;
  observacion_tecnica: string;
}

export interface TicketCancelar {
  comentario?: string;
}