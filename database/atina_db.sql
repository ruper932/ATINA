BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS reportes_semanales CASCADE;
DROP TABLE IF EXISTS auditoria_acciones CASCADE;
DROP TABLE IF EXISTS sincronizaciones_mcp CASCADE;
DROP TABLE IF EXISTS calibraciones_sensor CASCADE;
DROP TABLE IF EXISTS configuraciones_umbral CASCADE;
DROP TABLE IF EXISTS notificaciones_locales CASCADE;
DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS eventos_riego CASCADE;
DROP TABLE IF EXISTS estado_riego_actual CASCADE;
DROP TABLE IF EXISTS decisiones_riego CASCADE;
DROP TABLE IF EXISTS simulaciones_ml3 CASCADE;
DROP TABLE IF EXISTS predicciones_ml1 CASCADE;
DROP TABLE IF EXISTS lecturas_sensor CASCADE;
DROP TABLE IF EXISTS sensores CASCADE;
DROP TABLE IF EXISTS tipos_sensor CASCADE;
DROP TABLE IF EXISTS actuadores CASCADE;
DROP TABLE IF EXISTS tipos_actuador CASCADE;
DROP TABLE IF EXISTS dispositivos CASCADE;
DROP TABLE IF EXISTS tipos_dispositivo CASCADE;
DROP TABLE IF EXISTS fuentes_agua CASCADE;
DROP TABLE IF EXISTS atrapanieblas CASCADE;
DROP TABLE IF EXISTS invernaderos CASCADE;
DROP TABLE IF EXISTS ubicaciones CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    rol_id BIGINT NOT NULL REFERENCES roles(id),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE,
    password_hash TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    ultimo_acceso TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_usuario_estado CHECK (estado IN ('activo', 'inactivo', 'bloqueado'))
);

CREATE TABLE ubicaciones (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    tipo_ubicacion VARCHAR(30) NOT NULL,
    descripcion TEXT,
    parent_id BIGINT REFERENCES ubicaciones(id) ON DELETE SET NULL,
    latitud NUMERIC(9,6),
    longitud NUMERIC(9,6),
    altitud_m NUMERIC(8,2),
    CONSTRAINT chk_tipo_ubicacion CHECK (tipo_ubicacion IN ('campus', 'sector', 'invernadero', 'atrapaniebla', 'laboratorio', 'fuente_agua'))
);

CREATE TABLE invernaderos (
    id BIGSERIAL PRIMARY KEY,
    ubicacion_id BIGINT NOT NULL UNIQUE REFERENCES ubicaciones(id) ON DELETE RESTRICT,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    area_m2 NUMERIC(10,2) NOT NULL,
    prioridad_riego SMALLINT NOT NULL DEFAULT 1,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_invernadero_estado CHECK (estado IN ('activo', 'inactivo', 'mantenimiento')),
    CONSTRAINT chk_invernadero_area CHECK (area_m2 > 0),
    CONSTRAINT chk_invernadero_prioridad CHECK (prioridad_riego BETWEEN 1 AND 10)
);

CREATE TABLE atrapanieblas (
    id BIGSERIAL PRIMARY KEY,
    ubicacion_id BIGINT NOT NULL UNIQUE REFERENCES ubicaciones(id) ON DELETE RESTRICT,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    area_malla_m2 NUMERIC(10,2) NOT NULL,
    tipo_malla VARCHAR(50),
    orientacion VARCHAR(30),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    fecha_instalacion DATE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_atrapaniebla_estado CHECK (estado IN ('activo', 'inactivo', 'mantenimiento')),
    CONSTRAINT chk_area_malla CHECK (area_malla_m2 > 0)
);

CREATE TABLE fuentes_agua (
    id BIGSERIAL PRIMARY KEY,
    ubicacion_id BIGINT REFERENCES ubicaciones(id) ON DELETE SET NULL,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    tipo_fuente VARCHAR(30) NOT NULL,
    descripcion TEXT,
    capacidad_l NUMERIC(14,2),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_tipo_fuente CHECK (tipo_fuente IN ('atrapaniebla', 'manantial', 'tanque', 'otro')),
    CONSTRAINT chk_fuente_estado CHECK (estado IN ('activo', 'inactivo', 'mantenimiento'))
);

CREATE TABLE tipos_dispositivo (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE dispositivos (
    id BIGSERIAL PRIMARY KEY,
    tipo_dispositivo_id BIGINT NOT NULL REFERENCES tipos_dispositivo(id),
    ubicacion_id BIGINT REFERENCES ubicaciones(id) ON DELETE SET NULL,
    fuente_agua_id BIGINT REFERENCES fuentes_agua(id) ON DELETE SET NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    identificador_local VARCHAR(100),
    ip_local INET,
    version_firmware VARCHAR(50),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    ultima_conexion TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dispositivo_estado CHECK (estado IN ('activo', 'inactivo', 'falla', 'mantenimiento'))
);

CREATE TABLE tipos_sensor (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    variable_medida VARCHAR(50) NOT NULL,
    unidad_base VARCHAR(30) NOT NULL,
    descripcion TEXT
);

CREATE TABLE sensores (
    id BIGSERIAL PRIMARY KEY,
    dispositivo_id BIGINT NOT NULL REFERENCES dispositivos(id) ON DELETE CASCADE,
    tipo_sensor_id BIGINT NOT NULL REFERENCES tipos_sensor(id),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    modelo VARCHAR(50),
    numero_serie VARCHAR(100),
    precision_valor NUMERIC(10,4),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    fecha_instalacion DATE,
    CONSTRAINT chk_sensor_estado CHECK (estado IN ('activo', 'inactivo', 'falla', 'mantenimiento'))
);

CREATE TABLE lecturas_sensor (
    id BIGSERIAL PRIMARY KEY,
    sensor_id BIGINT NOT NULL REFERENCES sensores(id) ON DELETE CASCADE,
    valor NUMERIC(14,4) NOT NULL,
    calidad_dato VARCHAR(20) NOT NULL DEFAULT 'valido',
    timestamp_lectura TIMESTAMPTZ NOT NULL,
    timestamp_recepcion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadatos JSONB,
    CONSTRAINT chk_calidad_dato CHECK (calidad_dato IN ('valido', 'estimado', 'atipico', 'invalido'))
);

CREATE INDEX idx_lecturas_sensor_sensor_fecha ON lecturas_sensor(sensor_id, timestamp_lectura DESC);

CREATE TABLE tipos_actuador (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE actuadores (
    id BIGSERIAL PRIMARY KEY,
    dispositivo_id BIGINT NOT NULL REFERENCES dispositivos(id) ON DELETE CASCADE,
    tipo_actuador_id BIGINT NOT NULL REFERENCES tipos_actuador(id),
    invernadero_id BIGINT REFERENCES invernaderos(id) ON DELETE SET NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    fecha_instalacion DATE,
    CONSTRAINT chk_actuador_estado CHECK (estado IN ('activo', 'inactivo', 'falla', 'mantenimiento'))
);

CREATE TABLE predicciones_ml1 (
    id BIGSERIAL PRIMARY KEY,
    fuente_agua_id BIGINT NOT NULL REFERENCES fuentes_agua(id) ON DELETE CASCADE,
    fecha_prediccion DATE NOT NULL,
    fecha_objetivo DATE NOT NULL,
    volumen_predicho_l NUMERIC(14,4) NOT NULL,
    margen_error NUMERIC(10,4),
    confianza_modelo NUMERIC(5,2),
    variables_entrada_resumen JSONB,
    version_modelo VARCHAR(50) NOT NULL,
    generado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_prediccion_ml1 UNIQUE (fuente_agua_id, fecha_objetivo, version_modelo)
);

CREATE TABLE decisiones_riego (
    id BIGSERIAL PRIMARY KEY,
    invernadero_id BIGINT NOT NULL REFERENCES invernaderos(id) ON DELETE CASCADE,
    actuador_id BIGINT REFERENCES actuadores(id) ON DELETE SET NULL,
    fuente_agua_id BIGINT REFERENCES fuentes_agua(id) ON DELETE SET NULL,
    origen_decision VARCHAR(30) NOT NULL,
    modo_riego VARCHAR(20) NOT NULL,
    estado_valvula VARCHAR(20) NOT NULL,
    volumen_disponible_l NUMERIC(14,4) DEFAULT 0,
    demanda_estimada_l NUMERIC(14,4) DEFAULT 0,
    volumen_aplicado_l NUMERIC(14,4),
    decision_texto TEXT,
    ejecutado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_origen_decision CHECK (origen_decision IN ('ml2', 'manual', 'regla_seguridad', 'tecnico', 'docente')),
    CONSTRAINT chk_modo_riego CHECK (modo_riego IN ('automatico', 'manual', 'contingencia')),
    CONSTRAINT chk_estado_valvula CHECK (estado_valvula IN ('abierta', 'cerrada', 'parcial', 'falla'))
);

CREATE INDEX idx_decisiones_riego_invernadero_fecha ON decisiones_riego(invernadero_id, ejecutado_en DESC);

CREATE TABLE estado_riego_actual (
    invernadero_id BIGINT PRIMARY KEY REFERENCES invernaderos(id) ON DELETE CASCADE,
    ultima_decision_id BIGINT NOT NULL REFERENCES decisiones_riego(id) ON DELETE RESTRICT,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE simulaciones_ml3 (
    id BIGSERIAL PRIMARY KEY,
    invernadero_id BIGINT NOT NULL REFERENCES invernaderos(id) ON DELETE CASCADE,
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    horizonte_horas INTEGER NOT NULL DEFAULT 72,
    escenario VARCHAR(30) NOT NULL,
    nivel_riesgo VARCHAR(20) NOT NULL,
    descripcion_resultado TEXT,
    recomendacion TEXT,
    version_modelo VARCHAR(50) NOT NULL,
    generado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_escenario CHECK (escenario IN ('riego_normal', 'riego_restringido', 'sin_riego')),
    CONSTRAINT chk_nivel_riesgo CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto', 'critico')),
    CONSTRAINT chk_horizonte CHECK (horizonte_horas > 0)
);

CREATE INDEX idx_simulaciones_ml3_invernadero_fecha ON simulaciones_ml3(invernadero_id, fecha_generacion DESC);

CREATE TABLE alertas (
    id BIGSERIAL PRIMARY KEY,
    invernadero_id BIGINT REFERENCES invernaderos(id) ON DELETE SET NULL,
    dispositivo_id BIGINT REFERENCES dispositivos(id) ON DELETE SET NULL,
    sensor_id BIGINT REFERENCES sensores(id) ON DELETE SET NULL,
    decision_riego_id BIGINT REFERENCES decisiones_riego(id) ON DELETE SET NULL,
    simulacion_ml3_id BIGINT REFERENCES simulaciones_ml3(id) ON DELETE SET NULL,
    tipo_alerta VARCHAR(50) NOT NULL,
    severidad VARCHAR(20) NOT NULL,
    origen_alerta VARCHAR(30) NOT NULL,
    mensaje TEXT NOT NULL,
    estado_alerta VARCHAR(20) NOT NULL DEFAULT 'activa',
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_reconocimiento TIMESTAMPTZ,
    usuario_reconoce BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_severidad_alerta CHECK (severidad IN ('info', 'advertencia', 'alta', 'critica')),
    CONSTRAINT chk_estado_alerta CHECK (estado_alerta IN ('activa', 'reconocida', 'resuelta')),
    CONSTRAINT chk_origen_alerta CHECK (origen_alerta IN ('ml1', 'ml2', 'ml3', 'sensor', 'mcp', 'dashboard'))
);

CREATE INDEX idx_alertas_estado_fecha ON alertas(estado_alerta, fecha_generacion DESC);

CREATE TABLE notificaciones_locales (
    id BIGSERIAL PRIMARY KEY,
    alerta_id BIGINT NOT NULL REFERENCES alertas(id) ON DELETE CASCADE,
    tipo_notificacion VARCHAR(30) NOT NULL,
    estado_envio VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_envio TIMESTAMPTZ,
    fecha_confirmacion TIMESTAMPTZ,
    detalle_respuesta TEXT,
    CONSTRAINT chk_tipo_notificacion CHECK (tipo_notificacion IN ('led', 'buzzer', 'pantalla', 'audio')),
    CONSTRAINT chk_estado_envio CHECK (estado_envio IN ('pendiente', 'enviado', 'confirmado', 'fallido'))
);

CREATE TABLE configuraciones_umbral (
    id BIGSERIAL PRIMARY KEY,
    nombre_parametro VARCHAR(100) NOT NULL,
    descripcion TEXT,
    valor NUMERIC(14,4) NOT NULL,
    unidad VARCHAR(30),
    ambito VARCHAR(30) NOT NULL DEFAULT 'global',
    invernadero_id BIGINT REFERENCES invernaderos(id) ON DELETE CASCADE,
    sensor_id BIGINT REFERENCES sensores(id) ON DELETE CASCADE,
    editable BOOLEAN NOT NULL DEFAULT TRUE,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_por BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_ambito_umbral CHECK (ambito IN ('global', 'invernadero', 'sensor')),
    CONSTRAINT chk_umbral_scope CHECK (
        (ambito = 'global' AND invernadero_id IS NULL AND sensor_id IS NULL) OR
        (ambito = 'invernadero' AND invernadero_id IS NOT NULL AND sensor_id IS NULL) OR
        (ambito = 'sensor' AND sensor_id IS NOT NULL)
    )
);

CREATE TABLE calibraciones_sensor (
    id BIGSERIAL PRIMARY KEY,
    sensor_id BIGINT NOT NULL REFERENCES sensores(id) ON DELETE CASCADE,
    tipo_calibracion VARCHAR(50) NOT NULL,
    valor_anterior NUMERIC(14,4),
    valor_nuevo NUMERIC(14,4) NOT NULL,
    motivo TEXT,
    fecha_calibracion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE sincronizaciones_mcp (
    id BIGSERIAL PRIMARY KEY,
    dispositivo_id BIGINT REFERENCES dispositivos(id) ON DELETE SET NULL,
    origen VARCHAR(50) NOT NULL,
    destino VARCHAR(50) NOT NULL,
    tipo_recurso VARCHAR(50) NOT NULL,
    estado_sincronizacion VARCHAR(20) NOT NULL,
    cantidad_registros INTEGER NOT NULL DEFAULT 0,
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin TIMESTAMPTZ,
    mensaje_resultado TEXT,
    CONSTRAINT chk_estado_sync CHECK (estado_sincronizacion IN ('exito', 'parcial', 'fallo', 'en_proceso'))
);

CREATE TABLE auditoria_acciones (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    entidad_afectada VARCHAR(100) NOT NULL,
    entidad_id BIGINT,
    detalle JSONB,
    ip_origen INET,
    fecha_accion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reportes_semanales (
    id BIGSERIAL PRIMARY KEY,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    volumen_captado_l NUMERIC(14,4) NOT NULL DEFAULT 0,
    volumen_predicho_l NUMERIC(14,4) NOT NULL DEFAULT 0,
    eficiencia_riego NUMERIC(6,2),
    total_alertas INTEGER NOT NULL DEFAULT 0,
    resumen TEXT,
    generado_por BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_periodo_reporte CHECK (periodo_fin >= periodo_inicio)
);

INSERT INTO roles (nombre, descripcion) VALUES
('admin', 'Administrador del sistema'),
('docente', 'Docente técnico del CEA'),
('tecnico', 'Responsable de mantenimiento y calibración'),
('estudiante', 'Usuario final pedagógico')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO ubicaciones (id, nombre, tipo_ubicacion, descripcion, parent_id, altitud_m) VALUES
(1, 'CEA Ildefonso de las Muñecas', 'campus', 'Predio principal en Titicachi', NULL, 3800.00),
(2, 'Sector invernaderos', 'sector', 'Área productiva académica', 1, 3800.00),
(3, 'Laboratorio local', 'laboratorio', 'Espacio de dashboard y servidor MCP', 1, 3800.00),
(4, 'Atrapaniebla Norte', 'atrapaniebla', 'Estructura de captación 1', 1, 3800.00),
(5, 'Atrapaniebla Sur', 'atrapaniebla', 'Estructura de captación 2', 1, 3800.00),
(6, 'Invernadero 1', 'invernadero', 'Invernadero académico 1', 2, 3800.00),
(7, 'Invernadero 2', 'invernadero', 'Invernadero académico 2', 2, 3800.00),
(8, 'Invernadero 3', 'invernadero', 'Invernadero académico 3', 2, 3800.00),
(9, 'Invernadero 4', 'invernadero', 'Invernadero académico 4', 2, 3800.00),
(10, 'Manantial comunitario', 'fuente_agua', 'Fuente hídrica principal actual', 1, 3800.00)
ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('ubicaciones', 'id'), COALESCE((SELECT MAX(id) FROM ubicaciones), 1), true);

INSERT INTO invernaderos (ubicacion_id, codigo, nombre, descripcion, area_m2, prioridad_riego) VALUES
(6, 'INV-01', 'Invernadero 1', 'Invernadero académico 1', 20.00, 1),
(7, 'INV-02', 'Invernadero 2', 'Invernadero académico 2', 20.00, 2),
(8, 'INV-03', 'Invernadero 3', 'Invernadero académico 3', 20.00, 3),
(9, 'INV-04', 'Invernadero 4', 'Invernadero académico 4', 20.00, 4)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO atrapanieblas (ubicacion_id, codigo, nombre, area_malla_m2, tipo_malla, orientacion, fecha_instalacion) VALUES
(4, 'ATR-01', 'Atrapaniebla Norte', 20.00, 'Raschel', 'Norte', CURRENT_DATE),
(5, 'ATR-02', 'Atrapaniebla Sur', 20.00, 'Raschel', 'Sur', CURRENT_DATE)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO fuentes_agua (ubicacion_id, codigo, nombre, tipo_fuente, descripcion, capacidad_l) VALUES
(10, 'FTE-01', 'Manantial comunitario', 'manantial', 'Fuente hídrica principal del CEA', NULL),
(4, 'FTE-02', 'Captación Atrapaniebla Norte', 'atrapaniebla', 'Agua captada por la estructura norte', NULL),
(5, 'FTE-03', 'Captación Atrapaniebla Sur', 'atrapaniebla', 'Agua captada por la estructura sur', NULL)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO tipos_dispositivo (nombre, descripcion) VALUES
('ESP32', 'Microcontrolador para adquisición y control local'),
('Servidor MCP', 'Servidor local de interoperabilidad'),
('Gateway', 'Puente de comunicación local')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipos_sensor (nombre, variable_medida, unidad_base, descripcion) VALUES
('BME680 Temperatura', 'temperatura', 'C', 'Sensor de temperatura ambiental'),
('BME680 Presion', 'presion_atmosferica', 'hPa', 'Sensor de presión atmosférica'),
('BME680 Humedad', 'humedad_relativa', '%', 'Sensor de humedad relativa'),
('Caudalimetro', 'caudal', 'L/min', 'Sensor de caudal de agua captada')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipos_actuador (nombre, descripcion) VALUES
('Valvula solenoide', 'Actuador de apertura y cierre de riego')
ON CONFLICT (nombre) DO NOTHING;

COMMIT;
