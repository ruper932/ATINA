BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- LIMPIEZA
-- =========================================================

DROP TABLE IF EXISTS reportes_semanales CASCADE;
DROP TABLE IF EXISTS sincronizaciones_mcp CASCADE;
DROP TABLE IF EXISTS configuraciones_umbral_sensores CASCADE;
DROP TABLE IF EXISTS configuraciones_umbral_invernaderos CASCADE;
DROP TABLE IF EXISTS configuraciones_umbral CASCADE;
DROP TABLE IF EXISTS parametros_umbral CASCADE;
DROP TABLE IF EXISTS notificaciones_locales CASCADE;
DROP TABLE IF EXISTS alertas_simulaciones_ml CASCADE;
DROP TABLE IF EXISTS alertas_decisiones_riego CASCADE;
DROP TABLE IF EXISTS alertas_sensores CASCADE;
DROP TABLE IF EXISTS alertas_dispositivos CASCADE;
DROP TABLE IF EXISTS alertas_invernaderos CASCADE;
DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS estado_riego_actual CASCADE;
DROP TABLE IF EXISTS eventos_riego CASCADE;
DROP TABLE IF EXISTS metricas_decision_riego CASCADE;
DROP TABLE IF EXISTS decisiones_riego_fuentes_agua CASCADE;
DROP TABLE IF EXISTS decisiones_riego_actuadores CASCADE;
DROP TABLE IF EXISTS decisiones_riego_invernaderos CASCADE;
DROP TABLE IF EXISTS decisiones_riego CASCADE;
DROP TABLE IF EXISTS simulaciones_ml CASCADE;
DROP TABLE IF EXISTS predicciones_ml CASCADE;
DROP TABLE IF EXISTS modelos_ml CASCADE;
DROP TABLE IF EXISTS calibraciones_sensor CASCADE;
DROP TABLE IF EXISTS lecturas_sensor CASCADE;
DROP TABLE IF EXISTS sensores CASCADE;
DROP TABLE IF EXISTS tipos_sensor CASCADE;
DROP TABLE IF EXISTS actuadores_invernaderos CASCADE;
DROP TABLE IF EXISTS actuadores CASCADE;
DROP TABLE IF EXISTS tipos_actuador CASCADE;
DROP TABLE IF EXISTS dispositivos_fuentes_agua CASCADE;
DROP TABLE IF EXISTS dispositivos_ubicaciones CASCADE;
DROP TABLE IF EXISTS dispositivos CASCADE;
DROP TABLE IF EXISTS tipos_dispositivo CASCADE;
DROP TABLE IF EXISTS fuentes_agua_atrapanieblas CASCADE;
DROP TABLE IF EXISTS fuentes_agua CASCADE;
DROP TABLE IF EXISTS tipos_fuente_agua CASCADE;
DROP TABLE IF EXISTS atrapanieblas CASCADE;
DROP TABLE IF EXISTS invernaderos CASCADE;
DROP TABLE IF EXISTS ubicaciones CASCADE;
DROP TABLE IF EXISTS tipos_ubicacion CASCADE;
DROP TABLE IF EXISTS auditoria_acciones CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

DROP TABLE IF EXISTS estados_usuario CASCADE;
DROP TABLE IF EXISTS estados_invernadero CASCADE;
DROP TABLE IF EXISTS estados_atrapaniebla CASCADE;
DROP TABLE IF EXISTS estados_fuente_agua CASCADE;
DROP TABLE IF EXISTS estados_dispositivo CASCADE;
DROP TABLE IF EXISTS estados_sensor CASCADE;
DROP TABLE IF EXISTS estados_actuador CASCADE;
DROP TABLE IF EXISTS calidades_dato CASCADE;
DROP TABLE IF EXISTS origenes_decision CASCADE;
DROP TABLE IF EXISTS modos_riego CASCADE;
DROP TABLE IF EXISTS estados_valvula CASCADE;
DROP TABLE IF EXISTS escenarios_simulacion CASCADE;
DROP TABLE IF EXISTS niveles_riesgo CASCADE;
DROP TABLE IF EXISTS severidades_alerta CASCADE;
DROP TABLE IF EXISTS origenes_alerta CASCADE;
DROP TABLE IF EXISTS estados_alerta CASCADE;
DROP TABLE IF EXISTS tipos_notificacion CASCADE;
DROP TABLE IF EXISTS estados_envio CASCADE;
DROP TABLE IF EXISTS ambitos_umbral CASCADE;
DROP TABLE IF EXISTS estados_sincronizacion CASCADE;

-- =========================================================
-- CATALOGOS
-- =========================================================

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE estados_usuario (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE tipos_ubicacion (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE estados_invernadero (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE estados_atrapaniebla (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE tipos_fuente_agua (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE estados_fuente_agua (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE tipos_dispositivo (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE estados_dispositivo (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE tipos_sensor (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    variable_medida VARCHAR(50) NOT NULL,
    unidad_base VARCHAR(30) NOT NULL,
    descripcion TEXT
);

CREATE TABLE estados_sensor (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE calidades_dato (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE tipos_actuador (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE estados_actuador (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE origenes_decision (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE modos_riego (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE estados_valvula (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE escenarios_simulacion (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE niveles_riesgo (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE severidades_alerta (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE origenes_alerta (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE estados_alerta (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE tipos_notificacion (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE estados_envio (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE ambitos_umbral (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE estados_sincronizacion (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT
);

-- =========================================================
-- SEGURIDAD
-- =========================================================

CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    rol_id BIGINT NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    correo_electronico VARCHAR(150) UNIQUE,
    hash_password TEXT NOT NULL,
    estado_usuario_id BIGINT NOT NULL,
    ultimo_acceso TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_usuarios_rol
        FOREIGN KEY (rol_id) REFERENCES roles(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_usuarios_estado
        FOREIGN KEY (estado_usuario_id) REFERENCES estados_usuario(id)
        ON DELETE RESTRICT
);

CREATE TABLE auditoria_acciones (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT,
    accion VARCHAR(100) NOT NULL,
    entidad_afectada VARCHAR(100) NOT NULL,
    entidad_id BIGINT,
    detalle_json JSONB,
    ip_origen INET,
    fecha_accion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_auditoria_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE SET NULL
);

-- =========================================================
-- UBICACIONES E INFRAESTRUCTURA
-- =========================================================

CREATE TABLE ubicaciones (
    id BIGSERIAL PRIMARY KEY,
    tipo_ubicacion_id BIGINT NOT NULL,
    ubicacion_padre_id BIGINT,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    latitud NUMERIC(9,6),
    longitud NUMERIC(9,6),
    altitud_m NUMERIC(8,2),
    CONSTRAINT fk_ubicaciones_tipo
        FOREIGN KEY (tipo_ubicacion_id) REFERENCES tipos_ubicacion(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_ubicaciones_padre
        FOREIGN KEY (ubicacion_padre_id) REFERENCES ubicaciones(id)
        ON DELETE SET NULL
);

CREATE TABLE invernaderos (
    id BIGSERIAL PRIMARY KEY,
    ubicacion_id BIGINT NOT NULL UNIQUE,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    area_m2 NUMERIC(10,2) NOT NULL,
    prioridad_riego SMALLINT NOT NULL DEFAULT 1,
    estado_invernadero_id BIGINT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_invernaderos_ubicacion
        FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_invernaderos_estado
        FOREIGN KEY (estado_invernadero_id) REFERENCES estados_invernadero(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_invernaderos_area
        CHECK (area_m2 > 0),
    CONSTRAINT chk_invernaderos_prioridad
        CHECK (prioridad_riego BETWEEN 1 AND 10)
);

CREATE TABLE atrapanieblas (
    id BIGSERIAL PRIMARY KEY,
    ubicacion_id BIGINT NOT NULL UNIQUE,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    area_malla_m2 NUMERIC(10,2) NOT NULL,
    tipo_malla VARCHAR(50),
    orientacion VARCHAR(30),
    estado_atrapaniebla_id BIGINT NOT NULL,
    fecha_instalacion DATE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_atrapanieblas_ubicacion
        FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_atrapanieblas_estado
        FOREIGN KEY (estado_atrapaniebla_id) REFERENCES estados_atrapaniebla(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_atrapanieblas_area
        CHECK (area_malla_m2 > 0)
);

CREATE TABLE fuentes_agua (
    id BIGSERIAL PRIMARY KEY,
    ubicacion_id BIGINT,
    tipo_fuente_agua_id BIGINT NOT NULL,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    capacidad_l NUMERIC(14,2),
    estado_fuente_agua_id BIGINT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_fuentes_agua_ubicacion
        FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_fuentes_agua_tipo
        FOREIGN KEY (tipo_fuente_agua_id) REFERENCES tipos_fuente_agua(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_fuentes_agua_estado
        FOREIGN KEY (estado_fuente_agua_id) REFERENCES estados_fuente_agua(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_fuentes_agua_capacidad
        CHECK (capacidad_l IS NULL OR capacidad_l >= 0)
);

CREATE TABLE fuentes_agua_atrapanieblas (
    id BIGSERIAL PRIMARY KEY,
    fuente_agua_id BIGINT NOT NULL,
    atrapaniebla_id BIGINT NOT NULL,
    CONSTRAINT fk_fuentes_agua_atrapanieblas_fuente
        FOREIGN KEY (fuente_agua_id) REFERENCES fuentes_agua(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_fuentes_agua_atrapanieblas_atrapaniebla
        FOREIGN KEY (atrapaniebla_id) REFERENCES atrapanieblas(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_fuentes_agua_atrapanieblas
        UNIQUE (fuente_agua_id, atrapaniebla_id)
);

-- =========================================================
-- DISPOSITIVOS Y SENSORES
-- =========================================================

CREATE TABLE dispositivos (
    id BIGSERIAL PRIMARY KEY,
    tipo_dispositivo_id BIGINT NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    identificador_local VARCHAR(100),
    ip_local INET,
    version_firmware VARCHAR(50),
    estado_dispositivo_id BIGINT NOT NULL,
    ultima_conexion TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_dispositivos_tipo
        FOREIGN KEY (tipo_dispositivo_id) REFERENCES tipos_dispositivo(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_dispositivos_estado
        FOREIGN KEY (estado_dispositivo_id) REFERENCES estados_dispositivo(id)
        ON DELETE RESTRICT
);

CREATE TABLE dispositivos_ubicaciones (
    id BIGSERIAL PRIMARY KEY,
    dispositivo_id BIGINT NOT NULL,
    ubicacion_id BIGINT NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ,
    CONSTRAINT fk_dispositivos_ubicaciones_dispositivo
        FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_dispositivos_ubicaciones_ubicacion
        FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_dispositivos_ubicaciones_fechas
        CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    CONSTRAINT uq_dispositivos_ubicaciones
        UNIQUE (dispositivo_id, ubicacion_id, fecha_inicio)
);

CREATE TABLE dispositivos_fuentes_agua (
    id BIGSERIAL PRIMARY KEY,
    dispositivo_id BIGINT NOT NULL,
    fuente_agua_id BIGINT NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ,
    CONSTRAINT fk_dispositivos_fuentes_agua_dispositivo
        FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_dispositivos_fuentes_agua_fuente
        FOREIGN KEY (fuente_agua_id) REFERENCES fuentes_agua(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_dispositivos_fuentes_agua_fechas
        CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    CONSTRAINT uq_dispositivos_fuentes_agua
        UNIQUE (dispositivo_id, fuente_agua_id, fecha_inicio)
);

CREATE TABLE sensores (
    id BIGSERIAL PRIMARY KEY,
    dispositivo_id BIGINT NOT NULL,
    tipo_sensor_id BIGINT NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    modelo VARCHAR(50),
    numero_serie VARCHAR(100),
    precision_valor NUMERIC(10,4),
    estado_sensor_id BIGINT NOT NULL,
    fecha_instalacion DATE,
    CONSTRAINT fk_sensores_dispositivo
        FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_sensores_tipo
        FOREIGN KEY (tipo_sensor_id) REFERENCES tipos_sensor(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_sensores_estado
        FOREIGN KEY (estado_sensor_id) REFERENCES estados_sensor(id)
        ON DELETE RESTRICT
);

CREATE TABLE lecturas_sensor (
    id BIGSERIAL PRIMARY KEY,
    sensor_id BIGINT NOT NULL,
    valor NUMERIC(14,4) NOT NULL,
    calidad_dato_id BIGINT NOT NULL,
    timestamp_lectura TIMESTAMPTZ NOT NULL,
    timestamp_recepcion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadatos_json JSONB,
    CONSTRAINT fk_lecturas_sensor_sensor
        FOREIGN KEY (sensor_id) REFERENCES sensores(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_lecturas_sensor_calidad
        FOREIGN KEY (calidad_dato_id) REFERENCES calidades_dato(id)
        ON DELETE RESTRICT
);

CREATE TABLE calibraciones_sensor (
    id BIGSERIAL PRIMARY KEY,
    sensor_id BIGINT NOT NULL,
    tipo_calibracion VARCHAR(50) NOT NULL,
    valor_anterior NUMERIC(14,4),
    valor_nuevo NUMERIC(14,4) NOT NULL,
    motivo TEXT,
    usuario_id BIGINT,
    fecha_calibracion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_calibraciones_sensor_sensor
        FOREIGN KEY (sensor_id) REFERENCES sensores(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_calibraciones_sensor_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE SET NULL
);

-- =========================================================
-- ACTUADORES
-- =========================================================

CREATE TABLE actuadores (
    id BIGSERIAL PRIMARY KEY,
    dispositivo_id BIGINT NOT NULL,
    tipo_actuador_id BIGINT NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    estado_actuador_id BIGINT NOT NULL,
    fecha_instalacion DATE,
    CONSTRAINT fk_actuadores_dispositivo
        FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_actuadores_tipo
        FOREIGN KEY (tipo_actuador_id) REFERENCES tipos_actuador(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_actuadores_estado
        FOREIGN KEY (estado_actuador_id) REFERENCES estados_actuador(id)
        ON DELETE RESTRICT
);

CREATE TABLE actuadores_invernaderos (
    id BIGSERIAL PRIMARY KEY,
    actuador_id BIGINT NOT NULL,
    invernadero_id BIGINT NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ,
    CONSTRAINT fk_actuadores_invernaderos_actuador
        FOREIGN KEY (actuador_id) REFERENCES actuadores(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_actuadores_invernaderos_invernadero
        FOREIGN KEY (invernadero_id) REFERENCES invernaderos(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_actuadores_invernaderos_fechas
        CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    CONSTRAINT uq_actuadores_invernaderos
        UNIQUE (actuador_id, invernadero_id, fecha_inicio)
);

-- =========================================================
-- MODELOS ML
-- =========================================================

CREATE TABLE modelos_ml (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_modelo VARCHAR(50) NOT NULL,
    version VARCHAR(50) NOT NULL,
    objetivo VARCHAR(100) NOT NULL,
    framework VARCHAR(50),
    descripcion TEXT,
    ruta_artefacto TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_modelos_ml
        UNIQUE (nombre, version)
);

CREATE TABLE predicciones_ml (
    id BIGSERIAL PRIMARY KEY,
    modelo_ml_id BIGINT NOT NULL,
    fuente_agua_id BIGINT NOT NULL,
    fecha_prediccion DATE NOT NULL,
    fecha_objetivo DATE NOT NULL,
    volumen_predicho_l NUMERIC(14,4) NOT NULL,
    margen_error NUMERIC(10,4),
    confianza_modelo NUMERIC(5,2),
    resumen_entrada_json JSONB,
    generado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_predicciones_ml_modelo
        FOREIGN KEY (modelo_ml_id) REFERENCES modelos_ml(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_predicciones_ml_fuente
        FOREIGN KEY (fuente_agua_id) REFERENCES fuentes_agua(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_predicciones_ml
        UNIQUE (modelo_ml_id, fuente_agua_id, fecha_objetivo)
);

CREATE TABLE simulaciones_ml (
    id BIGSERIAL PRIMARY KEY,
    modelo_ml_id BIGINT NOT NULL,
    invernadero_id BIGINT NOT NULL,
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    horizonte_horas INTEGER NOT NULL,
    escenario_simulacion_id BIGINT NOT NULL,
    nivel_riesgo_id BIGINT NOT NULL,
    descripcion_resultado TEXT,
    recomendacion TEXT,
    generado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_simulaciones_ml_modelo
        FOREIGN KEY (modelo_ml_id) REFERENCES modelos_ml(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_simulaciones_ml_invernadero
        FOREIGN KEY (invernadero_id) REFERENCES invernaderos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_simulaciones_ml_escenario
        FOREIGN KEY (escenario_simulacion_id) REFERENCES escenarios_simulacion(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_simulaciones_ml_nivel_riesgo
        FOREIGN KEY (nivel_riesgo_id) REFERENCES niveles_riesgo(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_simulaciones_ml_horizonte
        CHECK (horizonte_horas > 0)
);

-- =========================================================
-- RIEGO
-- =========================================================

CREATE TABLE decisiones_riego (
    id BIGSERIAL PRIMARY KEY,
    origen_decision_id BIGINT NOT NULL,
    modo_riego_id BIGINT NOT NULL,
    estado_valvula_id BIGINT NOT NULL,
    texto_decision TEXT,
    ejecutado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_decisiones_riego_origen
        FOREIGN KEY (origen_decision_id) REFERENCES origenes_decision(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_decisiones_riego_modo
        FOREIGN KEY (modo_riego_id) REFERENCES modos_riego(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_decisiones_riego_estado_valvula
        FOREIGN KEY (estado_valvula_id) REFERENCES estados_valvula(id)
        ON DELETE RESTRICT
);

CREATE TABLE decisiones_riego_invernaderos (
    id BIGSERIAL PRIMARY KEY,
    decision_riego_id BIGINT NOT NULL,
    invernadero_id BIGINT NOT NULL,
    CONSTRAINT fk_decisiones_riego_invernaderos_decision
        FOREIGN KEY (decision_riego_id) REFERENCES decisiones_riego(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_decisiones_riego_invernaderos_invernadero
        FOREIGN KEY (invernadero_id) REFERENCES invernaderos(id)
        ON DELETE RESTRICT,
    CONSTRAINT uq_decisiones_riego_invernaderos
        UNIQUE (decision_riego_id, invernadero_id)
);

CREATE TABLE decisiones_riego_actuadores (
    id BIGSERIAL PRIMARY KEY,
    decision_riego_id BIGINT NOT NULL,
    actuador_id BIGINT NOT NULL,
    CONSTRAINT fk_decisiones_riego_actuadores_decision
        FOREIGN KEY (decision_riego_id) REFERENCES decisiones_riego(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_decisiones_riego_actuadores_actuador
        FOREIGN KEY (actuador_id) REFERENCES actuadores(id)
        ON DELETE RESTRICT,
    CONSTRAINT uq_decisiones_riego_actuadores
        UNIQUE (decision_riego_id, actuador_id)
);

CREATE TABLE decisiones_riego_fuentes_agua (
    id BIGSERIAL PRIMARY KEY,
    decision_riego_id BIGINT NOT NULL,
    fuente_agua_id BIGINT NOT NULL,
    CONSTRAINT fk_decisiones_riego_fuentes_agua_decision
        FOREIGN KEY (decision_riego_id) REFERENCES decisiones_riego(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_decisiones_riego_fuentes_agua_fuente
        FOREIGN KEY (fuente_agua_id) REFERENCES fuentes_agua(id)
        ON DELETE RESTRICT,
    CONSTRAINT uq_decisiones_riego_fuentes_agua
        UNIQUE (decision_riego_id, fuente_agua_id)
);

CREATE TABLE metricas_decision_riego (
    id BIGSERIAL PRIMARY KEY,
    decision_riego_id BIGINT NOT NULL UNIQUE,
    volumen_disponible_l NUMERIC(14,4),
    demanda_estimada_l NUMERIC(14,4),
    volumen_aplicado_l NUMERIC(14,4),
    CONSTRAINT fk_metricas_decision_riego_decision
        FOREIGN KEY (decision_riego_id) REFERENCES decisiones_riego(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_metricas_decision_riego_valores
        CHECK (
            (volumen_disponible_l IS NULL OR volumen_disponible_l >= 0) AND
            (demanda_estimada_l IS NULL OR demanda_estimada_l >= 0) AND
            (volumen_aplicado_l IS NULL OR volumen_aplicado_l >= 0)
        )
);

CREATE TABLE eventos_riego (
    id BIGSERIAL PRIMARY KEY,
    decision_riego_id BIGINT NOT NULL,
    inicio_evento TIMESTAMPTZ NOT NULL,
    fin_evento TIMESTAMPTZ,
    duracion_segundos INTEGER,
    observaciones TEXT,
    CONSTRAINT fk_eventos_riego_decision
        FOREIGN KEY (decision_riego_id) REFERENCES decisiones_riego(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_eventos_riego_fechas
        CHECK (fin_evento IS NULL OR fin_evento >= inicio_evento),
    CONSTRAINT chk_eventos_riego_duracion
        CHECK (duracion_segundos IS NULL OR duracion_segundos >= 0)
);

CREATE TABLE estado_riego_actual (
    id BIGSERIAL PRIMARY KEY,
    invernadero_id BIGINT NOT NULL UNIQUE,
    ultima_decision_id BIGINT NOT NULL,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_estado_riego_actual_invernadero
        FOREIGN KEY (invernadero_id) REFERENCES invernaderos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_estado_riego_actual_decision
        FOREIGN KEY (ultima_decision_id) REFERENCES decisiones_riego(id)
        ON DELETE RESTRICT
);

-- =========================================================
-- ALERTAS
-- =========================================================

CREATE TABLE alertas (
    id BIGSERIAL PRIMARY KEY,
    tipo_alerta VARCHAR(50) NOT NULL,
    severidad_alerta_id BIGINT NOT NULL,
    origen_alerta_id BIGINT NOT NULL,
    mensaje TEXT NOT NULL,
    estado_alerta_id BIGINT NOT NULL,
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_reconocimiento TIMESTAMPTZ,
    usuario_reconoce_id BIGINT,
    CONSTRAINT fk_alertas_severidad
        FOREIGN KEY (severidad_alerta_id) REFERENCES severidades_alerta(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_alertas_origen
        FOREIGN KEY (origen_alerta_id) REFERENCES origenes_alerta(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_alertas_estado
        FOREIGN KEY (estado_alerta_id) REFERENCES estados_alerta(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_alertas_usuario_reconoce
        FOREIGN KEY (usuario_reconoce_id) REFERENCES usuarios(id)
        ON DELETE SET NULL,
    CONSTRAINT chk_alertas_reconocimiento
        CHECK (fecha_reconocimiento IS NULL OR fecha_reconocimiento >= fecha_generacion)
);

CREATE TABLE alertas_invernaderos (
    id BIGSERIAL PRIMARY KEY,
    alerta_id BIGINT NOT NULL,
    invernadero_id BIGINT NOT NULL,
    CONSTRAINT fk_alertas_invernaderos_alerta
        FOREIGN KEY (alerta_id) REFERENCES alertas(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_alertas_invernaderos_invernadero
        FOREIGN KEY (invernadero_id) REFERENCES invernaderos(id)
        ON DELETE RESTRICT,
    CONSTRAINT uq_alertas_invernaderos
        UNIQUE (alerta_id, invernadero_id)
);

CREATE TABLE alertas_dispositivos (
    id BIGSERIAL PRIMARY KEY,
    alerta_id BIGINT NOT NULL,
    dispositivo_id BIGINT NOT NULL,
    CONSTRAINT fk_alertas_dispositivos_alerta
        FOREIGN KEY (alerta_id) REFERENCES alertas(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_alertas_dispositivos_dispositivo
        FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
        ON DELETE RESTRICT,
    CONSTRAINT uq_alertas_dispositivos
        UNIQUE (alerta_id, dispositivo_id)
);

CREATE TABLE alertas_sensores (
    id BIGSERIAL PRIMARY KEY,
    alerta_id BIGINT NOT NULL,
    sensor_id BIGINT NOT NULL,
    CONSTRAINT fk_alertas_sensores_alerta
        FOREIGN KEY (alerta_id) REFERENCES alertas(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_alertas_sensores_sensor
        FOREIGN KEY (sensor_id) REFERENCES sensores(id)
        ON DELETE RESTRICT,
    CONSTRAINT uq_alertas_sensores
        UNIQUE (alerta_id, sensor_id)
);

CREATE TABLE alertas_decisiones_riego (
    id BIGSERIAL PRIMARY KEY,
    alerta_id BIGINT NOT NULL,
    decision_riego_id BIGINT NOT NULL,
    CONSTRAINT fk_alertas_decisiones_riego_alerta
        FOREIGN KEY (alerta_id) REFERENCES alertas(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_alertas_decisiones_riego_decision
        FOREIGN KEY (decision_riego_id) REFERENCES decisiones_riego(id)
        ON DELETE RESTRICT,
    CONSTRAINT uq_alertas_decisiones_riego
        UNIQUE (alerta_id, decision_riego_id)
);

CREATE TABLE alertas_simulaciones_ml (
    id BIGSERIAL PRIMARY KEY,
    alerta_id BIGINT NOT NULL,
    simulacion_ml_id BIGINT NOT NULL,
    CONSTRAINT fk_alertas_simulaciones_ml_alerta
        FOREIGN KEY (alerta_id) REFERENCES alertas(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_alertas_simulaciones_ml_simulacion
        FOREIGN KEY (simulacion_ml_id) REFERENCES simulaciones_ml(id)
        ON DELETE RESTRICT,
    CONSTRAINT uq_alertas_simulaciones_ml
        UNIQUE (alerta_id, simulacion_ml_id)
);

CREATE TABLE notificaciones_locales (
    id BIGSERIAL PRIMARY KEY,
    alerta_id BIGINT NOT NULL,
    tipo_notificacion_id BIGINT NOT NULL,
    estado_envio_id BIGINT NOT NULL,
    fecha_envio TIMESTAMPTZ,
    fecha_confirmacion TIMESTAMPTZ,
    detalle_respuesta TEXT,
    CONSTRAINT fk_notificaciones_locales_alerta
        FOREIGN KEY (alerta_id) REFERENCES alertas(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_notificaciones_locales_tipo
        FOREIGN KEY (tipo_notificacion_id) REFERENCES tipos_notificacion(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_notificaciones_locales_estado
        FOREIGN KEY (estado_envio_id) REFERENCES estados_envio(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_notificaciones_locales_fechas
        CHECK (fecha_confirmacion IS NULL OR fecha_envio IS NULL OR fecha_confirmacion >= fecha_envio)
);

-- =========================================================
-- UMBRALES
-- =========================================================

CREATE TABLE parametros_umbral (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    unidad VARCHAR(30)
);

CREATE TABLE configuraciones_umbral (
    id BIGSERIAL PRIMARY KEY,
    parametro_umbral_id BIGINT NOT NULL,
    valor NUMERIC(14,4) NOT NULL,
    ambito_umbral_id BIGINT NOT NULL,
    editable BOOLEAN NOT NULL DEFAULT TRUE,
    actualizado_por BIGINT,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_configuraciones_umbral_parametro
        FOREIGN KEY (parametro_umbral_id) REFERENCES parametros_umbral(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_configuraciones_umbral_ambito
        FOREIGN KEY (ambito_umbral_id) REFERENCES ambitos_umbral(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_configuraciones_umbral_usuario
        FOREIGN KEY (actualizado_por) REFERENCES usuarios(id)
        ON DELETE SET NULL
);

CREATE TABLE configuraciones_umbral_invernaderos (
    id BIGSERIAL PRIMARY KEY,
    configuracion_umbral_id BIGINT NOT NULL,
    invernadero_id BIGINT NOT NULL,
    CONSTRAINT fk_configuraciones_umbral_invernaderos_configuracion
        FOREIGN KEY (configuracion_umbral_id) REFERENCES configuraciones_umbral(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_configuraciones_umbral_invernaderos_invernadero
        FOREIGN KEY (invernadero_id) REFERENCES invernaderos(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_configuraciones_umbral_invernaderos
        UNIQUE (configuracion_umbral_id, invernadero_id)
);

CREATE TABLE configuraciones_umbral_sensores (
    id BIGSERIAL PRIMARY KEY,
    configuracion_umbral_id BIGINT NOT NULL,
    sensor_id BIGINT NOT NULL,
    CONSTRAINT fk_configuraciones_umbral_sensores_configuracion
        FOREIGN KEY (configuracion_umbral_id) REFERENCES configuraciones_umbral(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_configuraciones_umbral_sensores_sensor
        FOREIGN KEY (sensor_id) REFERENCES sensores(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_configuraciones_umbral_sensores
        UNIQUE (configuracion_umbral_id, sensor_id)
);

-- =========================================================
-- SINCRONIZACION MCP
-- =========================================================

CREATE TABLE sincronizaciones_mcp (
    id BIGSERIAL PRIMARY KEY,
    estado_sincronizacion_id BIGINT NOT NULL,
    origen VARCHAR(50) NOT NULL,
    destino VARCHAR(50) NOT NULL,
    tipo_recurso VARCHAR(50) NOT NULL,
    cantidad_registros INTEGER NOT NULL DEFAULT 0,
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin TIMESTAMPTZ,
    mensaje_resultado TEXT,
    CONSTRAINT fk_sincronizaciones_mcp_estado
        FOREIGN KEY (estado_sincronizacion_id) REFERENCES estados_sincronizacion(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_sincronizaciones_mcp_registros
        CHECK (cantidad_registros >= 0),
    CONSTRAINT chk_sincronizaciones_mcp_fechas
        CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- =========================================================
-- REPORTES
-- =========================================================

CREATE TABLE reportes_semanales (
    id BIGSERIAL PRIMARY KEY,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    volumen_captado_l NUMERIC(14,4) NOT NULL DEFAULT 0,
    volumen_predicho_l NUMERIC(14,4) NOT NULL DEFAULT 0,
    eficiencia_riego NUMERIC(6,2),
    total_alertas INTEGER NOT NULL DEFAULT 0,
    resumen TEXT,
    generado_por BIGINT,
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_reportes_semanales_usuario
        FOREIGN KEY (generado_por) REFERENCES usuarios(id)
        ON DELETE SET NULL,
    CONSTRAINT chk_reportes_semanales_periodo
        CHECK (periodo_fin >= periodo_inicio),
    CONSTRAINT chk_reportes_semanales_valores
        CHECK (
            volumen_captado_l >= 0 AND
            volumen_predicho_l >= 0 AND
            total_alertas >= 0
        )
);

-- =========================================================
-- INDICES
-- =========================================================

CREATE INDEX idx_usuarios_rol_id ON usuarios(rol_id);
CREATE INDEX idx_usuarios_estado_usuario_id ON usuarios(estado_usuario_id);

CREATE INDEX idx_ubicaciones_tipo_ubicacion_id ON ubicaciones(tipo_ubicacion_id);
CREATE INDEX idx_ubicaciones_ubicacion_padre_id ON ubicaciones(ubicacion_padre_id);

CREATE INDEX idx_invernaderos_estado_invernadero_id ON invernaderos(estado_invernadero_id);
CREATE INDEX idx_atrapanieblas_estado_atrapaniebla_id ON atrapanieblas(estado_atrapaniebla_id);

CREATE INDEX idx_fuentes_agua_tipo_fuente_agua_id ON fuentes_agua(tipo_fuente_agua_id);
CREATE INDEX idx_fuentes_agua_estado_fuente_agua_id ON fuentes_agua(estado_fuente_agua_id);

CREATE INDEX idx_dispositivos_tipo_dispositivo_id ON dispositivos(tipo_dispositivo_id);
CREATE INDEX idx_dispositivos_estado_dispositivo_id ON dispositivos(estado_dispositivo_id);

CREATE INDEX idx_dispositivos_ubicaciones_dispositivo_id ON dispositivos_ubicaciones(dispositivo_id);
CREATE INDEX idx_dispositivos_ubicaciones_ubicacion_id ON dispositivos_ubicaciones(ubicacion_id);

CREATE INDEX idx_dispositivos_fuentes_agua_dispositivo_id ON dispositivos_fuentes_agua(dispositivo_id);
CREATE INDEX idx_dispositivos_fuentes_agua_fuente_agua_id ON dispositivos_fuentes_agua(fuente_agua_id);

CREATE INDEX idx_sensores_dispositivo_id ON sensores(dispositivo_id);
CREATE INDEX idx_sensores_tipo_sensor_id ON sensores(tipo_sensor_id);
CREATE INDEX idx_sensores_estado_sensor_id ON sensores(estado_sensor_id);

CREATE INDEX idx_lecturas_sensor_sensor_fecha ON lecturas_sensor(sensor_id, timestamp_lectura DESC);

CREATE INDEX idx_calibraciones_sensor_sensor_id ON calibraciones_sensor(sensor_id);
CREATE INDEX idx_actuadores_dispositivo_id ON actuadores(dispositivo_id);
CREATE INDEX idx_actuadores_tipo_actuador_id ON actuadores(tipo_actuador_id);
CREATE INDEX idx_actuadores_estado_actuador_id ON actuadores(estado_actuador_id);

CREATE INDEX idx_actuadores_invernaderos_actuador_id ON actuadores_invernaderos(actuador_id);
CREATE INDEX idx_actuadores_invernaderos_invernadero_id ON actuadores_invernaderos(invernadero_id);

CREATE INDEX idx_predicciones_ml_fuente_fecha ON predicciones_ml(fuente_agua_id, fecha_objetivo DESC);
CREATE INDEX idx_simulaciones_ml_invernadero_fecha ON simulaciones_ml(invernadero_id, fecha_generacion DESC);

CREATE INDEX idx_decisiones_riego_ejecutado_en ON decisiones_riego(ejecutado_en DESC);
CREATE INDEX idx_eventos_riego_decision_id ON eventos_riego(decision_riego_id);

CREATE INDEX idx_alertas_fecha_generacion ON alertas(fecha_generacion DESC);
CREATE INDEX idx_alertas_estado_alerta_id ON alertas(estado_alerta_id);

CREATE INDEX idx_sincronizaciones_mcp_fecha_inicio ON sincronizaciones_mcp(fecha_inicio DESC);
CREATE INDEX idx_reportes_semanales_periodo ON reportes_semanales(periodo_inicio, periodo_fin);

-- =========================================================
-- DATOS INICIALES
-- =========================================================

INSERT INTO roles (nombre, descripcion) VALUES
('administrador', 'Administrador general del sistema'),
('docente', 'Docente técnico del centro educativo'),
('tecnico', 'Responsable de mantenimiento y calibración'),
('estudiante', 'Usuario académico u operativo'),
('invitado', 'Usuario invitado')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO estados_usuario (nombre, descripcion) VALUES
('activo', 'Usuario habilitado'),
('inactivo', 'Usuario deshabilitado'),
('bloqueado', 'Usuario bloqueado por seguridad')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipos_ubicacion (nombre, descripcion) VALUES
('campus', 'Predio principal'),
('sector', 'Sector interno del campus'),
('invernadero', 'Espacio de producción agrícola'),
('atrapaniebla', 'Estructura de captación de niebla'),
('laboratorio', 'Ambiente técnico o servidor local'),
('fuente_agua', 'Punto físico de abastecimiento hídrico')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO estados_invernadero (nombre, descripcion) VALUES
('activo', 'Invernadero operativo'),
('inactivo', 'Invernadero fuera de servicio'),
('mantenimiento', 'Invernadero en mantenimiento')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO estados_atrapaniebla (nombre, descripcion) VALUES
('activo', 'Atrapaniebla operativo'),
('inactivo', 'Atrapaniebla fuera de servicio'),
('mantenimiento', 'Atrapaniebla en mantenimiento')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipos_fuente_agua (nombre, descripcion) VALUES
('manantial', 'Fuente natural de agua'),
('atrapaniebla', 'Agua proveniente de captación de niebla'),
('tanque', 'Almacenamiento en tanque'),
('otro', 'Otro tipo de fuente')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO estados_fuente_agua (nombre, descripcion) VALUES
('activo', 'Fuente disponible'),
('inactivo', 'Fuente no disponible'),
('mantenimiento', 'Fuente en mantenimiento')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipos_dispositivo (nombre, descripcion) VALUES
('ESP32', 'Microcontrolador para adquisición y control local'),
('Servidor MCP', 'Servidor local de interoperabilidad'),
('Gateway', 'Puente de comunicación local')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO estados_dispositivo (nombre, descripcion) VALUES
('activo', 'Dispositivo operativo'),
('inactivo', 'Dispositivo deshabilitado'),
('falla', 'Dispositivo con falla'),
('mantenimiento', 'Dispositivo en mantenimiento')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipos_sensor (nombre, variable_medida, unidad_base, descripcion) VALUES
('BME680 Temperatura', 'temperatura', 'C', 'Sensor de temperatura ambiental'),
('BME680 Presion', 'presion_atmosferica', 'hPa', 'Sensor de presión atmosférica'),
('BME680 Humedad', 'humedad_relativa', '%', 'Sensor de humedad relativa'),
('Caudalimetro', 'caudal', 'L/min', 'Sensor de caudal de agua')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO estados_sensor (nombre, descripcion) VALUES
('activo', 'Sensor operativo'),
('inactivo', 'Sensor deshabilitado'),
('falla', 'Sensor con falla'),
('mantenimiento', 'Sensor en mantenimiento')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO calidades_dato (nombre, descripcion) VALUES
('valido', 'Dato válido'),
('estimado', 'Dato estimado'),
('atipico', 'Dato atípico'),
('invalido', 'Dato inválido')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipos_actuador (nombre, descripcion) VALUES
('Valvula solenoide', 'Actuador de apertura y cierre de riego')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO estados_actuador (nombre, descripcion) VALUES
('activo', 'Actuador operativo'),
('inactivo', 'Actuador deshabilitado'),
('falla', 'Actuador con falla'),
('mantenimiento', 'Actuador en mantenimiento')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO origenes_decision (nombre, descripcion) VALUES
('ml2', 'Decisión tomada por modelo ML2'),
('manual', 'Decisión manual'),
('regla_seguridad', 'Decisión tomada por regla de seguridad'),
('tecnico', 'Decisión tomada por técnico'),
('docente', 'Decisión tomada por docente')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO modos_riego (nombre, descripcion) VALUES
('automatico', 'Riego automático'),
('manual', 'Riego manual'),
('contingencia', 'Riego por contingencia')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO estados_valvula (nombre, descripcion) VALUES
('abierta', 'Válvula abierta'),
('cerrada', 'Válvula cerrada'),
('parcial', 'Válvula parcialmente abierta'),
('falla', 'Válvula con falla')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO escenarios_simulacion (nombre, descripcion) VALUES
('riego_normal', 'Escenario con riego normal'),
('riego_restringido', 'Escenario con riego restringido'),
('sin_riego', 'Escenario sin riego')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO niveles_riesgo (nombre, descripcion) VALUES
('bajo', 'Riesgo bajo'),
('medio', 'Riesgo medio'),
('alto', 'Riesgo alto'),
('critico', 'Riesgo crítico')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO severidades_alerta (nombre, descripcion) VALUES
('info', 'Información general'),
('advertencia', 'Advertencia operativa'),
('alta', 'Alerta alta'),
('critica', 'Alerta crítica')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO origenes_alerta (nombre, descripcion) VALUES
('ml1', 'Alerta generada por ML1'),
('ml2', 'Alerta generada por ML2'),
('ml3', 'Alerta generada por ML3'),
('sensor', 'Alerta generada por sensores'),
('mcp', 'Alerta generada por sincronización MCP'),
('dashboard', 'Alerta generada desde dashboard')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO estados_alerta (nombre, descripcion) VALUES
('activa', 'Alerta activa'),
('reconocida', 'Alerta reconocida'),
('resuelta', 'Alerta resuelta')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipos_notificacion (nombre, descripcion) VALUES
('led', 'Notificación visual LED'),
('buzzer', 'Notificación sonora por buzzer'),
('pantalla', 'Notificación en pantalla local'),
('audio', 'Notificación por audio')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO estados_envio (nombre, descripcion) VALUES
('pendiente', 'Envío pendiente'),
('enviado', 'Notificación enviada'),
('confirmado', 'Recepción confirmada'),
('fallido', 'Envío fallido')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO ambitos_umbral (nombre, descripcion) VALUES
('global', 'Aplicación global'),
('invernadero', 'Aplicación por invernadero'),
('sensor', 'Aplicación por sensor')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO estados_sincronizacion (nombre, descripcion) VALUES
('exito', 'Sincronización exitosa'),
('parcial', 'Sincronización parcial'),
('fallo', 'Sincronización fallida'),
('en_proceso', 'Sincronización en proceso')
ON CONFLICT (nombre) DO NOTHING;

COMMIT;