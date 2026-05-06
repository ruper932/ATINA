// src/types/reportes.ts

export interface VReporteLecturasSensor {
  lectura_id: number;
  sensor_codigo: string;
  sensor_nombre: string;
  lectura_valor: number;
  fecha_lectura: string;
}

export interface VReporteAlertasInvernadero {
  alerta_id: number;
  invernadero_id: number;
  tipo_alerta: string;
  mensaje: string;
  fecha_generacion: string;
}

export interface VReporteInventarioDispositivos {
  dispositivo_id: number;
  codigo: string;
  nombre: string;
  tipo_dispositivo: string;
  estado_dispositivo_id: number;
}

export interface VReporteRiegoEjecutado {
  decision_id: number;
  invernadero_id: number;
  texto_decision: string;
  inicio_evento: string;
  duracion_segundos: number | null;
}

export interface VReportePrediccionesAgua {
  prediccion_id: number;
  fuente_agua: string;
  modelo_usado: string;
  fecha_objetivo: string;
  volumen_predicho_l: number;
}