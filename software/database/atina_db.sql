BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE roles (
    id              BIGSERIAL PRIMARY KEY,
    nombre_rol      VARCHAR(50) NOT NULL UNIQUE,
    descripcion     TEXT
);

CREATE TABLE usuarios (
    id              BIGSERIAL PRIMARY KEY,
    rol_id          BIGINT NOT NULL REFERENCES roles(id),
    nombres         VARCHAR(100) NOT NULL,
    apellidos       VARCHAR(100) NOT NULL,
    username        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(150) UNIQUE,
    password_hash   TEXT NOT NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'activo',
    ultimo_acceso   TIMESTAMPTZ,
    fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_usuario_estado CHECK (estado IN ('activo', 'inactivo', 'bloqueado'))
);

CREATE TABLE invernaderos (
    id                  BIGSERIAL PRIMARY KEY,
    nombre              VARCHAR(100) NOT NULL,
    codigo              VARCHAR(30) NOT NULL UNIQUE,
    descripcion         TEXT,
    ubicacion           VARCHAR(150),
    area_m2             NUMERIC(10,2),
    prioridad_riego     SMALLINT NOT NULL DEFAULT 1,
    estado              VARCHAR(20) NOT NULL DEFAULT 'activo',
    fecha_registro      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_invernadero_estado CHECK (estado IN ('activo', 'inactivo', 'mantenimiento'))
);

CREATE TABLE dispositivos (
    id                  BIGSERIAL PRIMARY KEY,
    nombre_dispositivo  VARCHAR(100) NOT NULL,
    tipo_dispositivo    VARCHAR(50) NOT NULL,
    codigo_dispositivo  VARCHAR(50) NOT NULL UNIQUE,
    ubicacion           VARCHAR(150),
    ip_local            INET,
    identificador_local VARCHAR(100),
    version_firmware    VARCHAR(50),
    estado              VARCHAR(20) NOT NULL DEFAULT 'activo',
    ultima_conexion     TIMESTAMPTZ,
    fecha_registro      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dispositivo_estado CHECK (estado IN ('activo', 'inactivo', 'falla', 'mantenimiento'))
);

CREATE TABLE sensores (
    id                  BIGSERIAL PRIMARY KEY,
    dispositivo_id      BIGINT NOT NULL REFERENCES dispositivos(id) ON DELETE CASCADE,
    invernadero_id      BIGINT REFERENCES invernaderos(id) ON DELETE SET NULL,
    tipo_sensor         VARCHAR(50) NOT NULL,
    nombre_sensor       VARCHAR(100) NOT NULL,
    unidad_medida       VARCHAR(30) NOT NULL,
    modelo              VARCHAR(50),
    numero_serie        VARCHAR(100),
    estado              VARCHAR(20) NOT NULL DEFAULT 'activo',
    fecha_instalacion   DATE,
    CONSTRAINT chk_sensor_estado CHECK (estado IN ('activo', 'inactivo', 'falla', 'mantenimiento'))
);

CREATE TABLE lecturas_sensor (
    id                  BIGSERIAL PRIMARY KEY,
    sensor_id           BIGINT NOT NULL REFERENCES sensores(id) ON DELETE CASCADE,
    dispositivo_id      BIGINT NOT NULL REFERENCES dispositivos(id) ON DELETE CASCADE,
    invernadero_id      BIGINT REFERENCES invernaderos(id) ON DELETE SET NULL,
    tipo_variable       VARCHAR(50) NOT NULL,
    valor               NUMERIC(14,4) NOT NULL,
    unidad              VARCHAR(30) NOT NULL,
    calidad_dato        VARCHAR(20) NOT NULL DEFAULT 'valido',
    timestamp_lectura   TIMESTAMPTZ NOT NULL,
    timestamp_recepcion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_calidad_dato CHECK (calidad_dato IN ('valido', 'estimado', 'atipico', 'invalido'))
);

CREATE INDEX idx_lecturas_sensor_sensor_fecha
    ON lecturas_sensor(sensor_id, timestamp_lectura DESC);

CREATE INDEX idx_lecturas_sensor_tipo_fecha
    ON lecturas_sensor(tipo_variable, timestamp_lectura DESC);

CREATE TABLE mediciones_caudal (
    id                  BIGSERIAL PRIMARY KEY,
    sensor_id           BIGINT NOT NULL REFERENCES sensores(id) ON DELETE CASCADE,
    dispositivo_id      BIGINT NOT NULL REFERENCES dispositivos(id) ON DELETE CASCADE,
    caudal_l_min        NUMERIC(12,4) NOT NULL DEFAULT 0,
    volumen_acumulado_l NUMERIC(14,4) NOT NULL DEFAULT 0,
    origen_agua         VARCHAR(50) NOT NULL DEFAULT 'atrapaniebla',
    timestamp_medicion  TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_origen_agua CHECK (origen_agua IN ('atrapaniebla', 'tanque', 'manantial', 'otro'))
);

CREATE INDEX idx_mediciones_caudal_fecha
    ON mediciones_caudal(timestamp_medicion DESC);

CREATE TABLE predicciones_ml1 (
    id                          BIGSERIAL PRIMARY KEY,
    fecha_prediccion            DATE NOT NULL,
    fecha_objetivo              DATE NOT NULL,
    volumen_predicho_l          NUMERIC(14,4) NOT NULL,
    margen_error                NUMERIC(10,4),
    confianza_modelo            NUMERIC(5,2),
    variables_entrada_resumen   JSONB,
    version_modelo              VARCHAR(50) NOT NULL,
    generado_en                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (fecha_objetivo, version_modelo)
);

CREATE TABLE escenarios_ml3 (
    id                      BIGSERIAL PRIMARY KEY,
    invernadero_id          BIGINT NOT NULL REFERENCES invernaderos(id) ON DELETE CASCADE,
    fecha_generacion        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    horizonte_horas         INTEGER NOT NULL DEFAULT 72,
    escenario               VARCHAR(30) NOT NULL,
    nivel_riesgo            VARCHAR(20) NOT NULL,
    descripcion_resultado   TEXT,
    recomendacion           TEXT,
    version_modelo          VARCHAR(50) NOT NULL,
    generado_en             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_escenario CHECK (escenario IN ('riego_normal', 'riego_restringido', 'sin_riego')),
    CONSTRAINT chk_nivel_riesgo CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto', 'critico'))
);

CREATE INDEX idx_escenarios_ml3_invernadero_fecha
    ON escenarios_ml3(invernadero_id, fecha_generacion DESC);

CREATE TABLE estado_riego (
    id                  BIGSERIAL PRIMARY KEY,
    invernadero_id      BIGINT NOT NULL UNIQUE REFERENCES invernaderos(id) ON DELETE CASCADE,
    dispositivo_id      BIGINT NOT NULL REFERENCES dispositivos(id) ON DELETE CASCADE,
    modo_riego          VARCHAR(20) NOT NULL DEFAULT 'automatico',
    estado_valvula      VARCHAR(20) NOT NULL DEFAULT 'cerrada',
    volumen_disponible_l NUMERIC(14,4) DEFAULT 0,
    demanda_estimada_l   NUMERIC(14,4) DEFAULT 0,
    decision_ml2       TEXT,
    ultima_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_modo_riego CHECK (modo_riego IN ('automatico', 'manual', 'contingencia')),
    CONSTRAINT chk_estado_valvula CHECK (estado_valvula IN ('abierta', 'cerrada', 'parcial', 'falla'))
);

CREATE TABLE eventos_riego (
    id                  BIGSERIAL PRIMARY KEY,
    invernadero_id      BIGINT NOT NULL REFERENCES invernaderos(id) ON DELETE CASCADE,
    dispositivo_id      BIGINT NOT NULL REFERENCES dispositivos(id) ON DELETE CASCADE,
    tipo_evento         VARCHAR(30) NOT NULL,
    origen_decision     VARCHAR(30) NOT NULL,
    inicio_evento       TIMESTAMPTZ NOT NULL,
    fin_evento          TIMESTAMPTZ,
    duracion_segundos   INTEGER,
    volumen_estimado_l  NUMERIC(14,4),
    observacion         TEXT,
    CONSTRAINT chk_tipo_evento_riego CHECK (tipo_evento IN ('inicio_riego', 'fin_riego', 'pausa_riego', 'prueba_valvula')),
    CONSTRAINT chk_origen_decision CHECK (origen_decision IN ('ml2', 'manual', 'regla_seguridad', 'tecnico', 'docente'))
);

CREATE INDEX idx_eventos_riego_invernadero_inicio
    ON eventos_riego(invernadero_id, inicio_evento DESC);

CREATE TABLE alertas (
    id                  BIGSERIAL PRIMARY KEY,
    invernadero_id      BIGINT REFERENCES invernaderos(id) ON DELETE SET NULL,
    tipo_alerta         VARCHAR(50) NOT NULL,
    severidad           VARCHAR(20) NOT NULL,
    origen_alerta       VARCHAR(30) NOT NULL,
    mensaje             TEXT NOT NULL,
    estado_alerta       VARCHAR(20) NOT NULL DEFAULT 'activa',
    fecha_generacion    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_reconocimiento TIMESTAMPTZ,
    usuario_reconoce    BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_severidad_alerta CHECK (severidad IN ('info', 'advertencia', 'alta', 'critica')),
    CONSTRAINT chk_estado_alerta CHECK (estado_alerta IN ('activa', 'reconocida', 'resuelta')),
    CONSTRAINT chk_origen_alerta CHECK (origen_alerta IN ('ml1', 'ml2', 'ml3', 'sensor', 'mcp', 'dashboard'))
);

CREATE INDEX idx_alertas_estado_fecha
    ON alertas(estado_alerta, fecha_generacion DESC);

CREATE TABLE notificaciones_locales (
    id                  BIGSERIAL PRIMARY KEY,
    alerta_id           BIGINT NOT NULL REFERENCES alertas(id) ON DELETE CASCADE,
    tipo_notificacion   VARCHAR(30) NOT NULL,
    estado_envio        VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_envio         TIMESTAMPTZ,
    fecha_confirmacion  TIMESTAMPTZ,
    detalle_respuesta   TEXT,
    CONSTRAINT chk_tipo_notificacion CHECK (tipo_notificacion IN ('led', 'buzzer', 'pantalla', 'audio')),
    CONSTRAINT chk_estado_envio CHECK (estado_envio IN ('pendiente', 'enviado', 'confirmado', 'fallido'))
);

CREATE TABLE configuraciones_umbral (
    id                  BIGSERIAL PRIMARY KEY,
    nombre_parametro    VARCHAR(100) NOT NULL,
    descripcion         TEXT,
    valor               NUMERIC(14,4) NOT NULL,
    unidad              VARCHAR(30),
    ambito              VARCHAR(30) NOT NULL DEFAULT 'global',
    invernadero_id      BIGINT REFERENCES invernaderos(id) ON DELETE CASCADE,
    editable            BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_por     BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_ambito_umbral CHECK (ambito IN ('global', 'invernadero', 'sensor'))
);

CREATE TABLE calibraciones_sensor (
    id                  BIGSERIAL PRIMARY KEY,
    sensor_id           BIGINT NOT NULL REFERENCES sensores(id) ON DELETE CASCADE,
    tipo_calibracion    VARCHAR(50) NOT NULL,
    valor_anterior      NUMERIC(14,4),
    valor_nuevo         NUMERIC(14,4) NOT NULL,
    motivo              TEXT,
    fecha_calibracion   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id          BIGINT REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE sincronizaciones_mcp (
    id                      BIGSERIAL PRIMARY KEY,
    origen                  VARCHAR(50) NOT NULL,
    destino                 VARCHAR(50) NOT NULL,
    tipo_recurso            VARCHAR(50) NOT NULL,
    estado_sincronizacion   VARCHAR(20) NOT NULL,
    cantidad_registros      INTEGER NOT NULL DEFAULT 0,
    fecha_inicio            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin               TIMESTAMPTZ,
    mensaje_resultado       TEXT,
    CONSTRAINT chk_estado_sync CHECK (estado_sincronizacion IN ('exito', 'parcial', 'fallo', 'en_proceso'))
);

CREATE TABLE auditoria_acciones (
    id                  BIGSERIAL PRIMARY KEY,
    usuario_id          BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    accion              VARCHAR(100) NOT NULL,
    entidad_afectada    VARCHAR(100) NOT NULL,
    entidad_id          BIGINT,
    detalle             JSONB,
    ip_origen           INET,
    fecha_accion        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reportes_semanales (
    id                  BIGSERIAL PRIMARY KEY,
    periodo_inicio      DATE NOT NULL,
    periodo_fin         DATE NOT NULL,
    volumen_captado_l   NUMERIC(14,4) NOT NULL DEFAULT 0,
    volumen_predicho_l  NUMERIC(14,4) NOT NULL DEFAULT 0,
    eficiencia_riego    NUMERIC(6,2),
    total_alertas       INTEGER NOT NULL DEFAULT 0,
    resumen             TEXT,
    fecha_generacion    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generado_por        BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_periodo_reporte CHECK (periodo_fin >= periodo_inicio)
);

INSERT INTO roles (nombre_rol, descripcion) VALUES
('admin', 'Administrador del sistema'),
('docente', 'Docente técnico del CEA'),
('tecnico', 'Responsable de mantenimiento y calibración'),
('estudiante', 'Usuario final pedagógico')
ON CONFLICT (nombre_rol) DO NOTHING;

INSERT INTO invernaderos (nombre, codigo, descripcion, ubicacion, area_m2, prioridad_riego)
VALUES
('Invernadero 1', 'INV-01', 'Invernadero académico 1', 'Titicachi', 20.00, 1),
('Invernadero 2', 'INV-02', 'Invernadero académico 2', 'Titicachi', 20.00, 2),
('Invernadero 3', 'INV-03', 'Invernadero académico 3', 'Titicachi', 20.00, 3),
('Invernadero 4', 'INV-04', 'Invernadero académico 4', 'Titicachi', 20.00, 4)
ON CONFLICT (codigo) DO NOTHING;

COMMIT;
