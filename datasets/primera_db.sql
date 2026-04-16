BEGIN;

CREATE TABLE roles (
    id_rol INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE usuarios (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_rol INTEGER NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    contrasena_hash TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_roles
        FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_usuarios_estado
        CHECK (estado IN ('activo', 'inactivo', 'bloqueado'))
);

CREATE TABLE atrapanieblas (
    id_atrapanieblas INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    ubicacion VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    fecha_instalacion DATE,
    descripcion TEXT,
    CONSTRAINT chk_atrapanieblas_estado
        CHECK (estado IN ('activo', 'inactivo', 'mantenimiento'))
);

CREATE TABLE invernaderos (
    id_invernadero INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    ubicacion VARCHAR(150),
    tipo_cultivo VARCHAR(100),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    descripcion TEXT,
    CONSTRAINT chk_invernaderos_estado
        CHECK (estado IN ('activo', 'inactivo', 'mantenimiento'))
);

CREATE TABLE tanques (
    id_tanque INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    capacidad_litros NUMERIC(10,2) NOT NULL,
    nivel_actual NUMERIC(10,2) NOT NULL DEFAULT 0,
    ubicacion VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    CONSTRAINT chk_tanques_capacidad
        CHECK (capacidad_litros > 0),
    CONSTRAINT chk_tanques_nivel
        CHECK (nivel_actual >= 0),
    CONSTRAINT chk_tanques_estado
        CHECK (estado IN ('activo', 'inactivo', 'mantenimiento'))
);

CREATE TABLE dispositivos (
    id_dispositivo INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(50) NOT NULL,
    ubicacion VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    fecha_instalacion DATE,
    descripcion TEXT,
    CONSTRAINT chk_dispositivos_estado
        CHECK (estado IN ('activo', 'inactivo', 'mantenimiento', 'fallo'))
);

CREATE TABLE sensores (
    id_sensor INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_dispositivo INTEGER NOT NULL,
    tipo_sensor VARCHAR(50) NOT NULL,
    unidad_medida VARCHAR(30) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    CONSTRAINT fk_sensores_dispositivos
        FOREIGN KEY (id_dispositivo) REFERENCES dispositivos(id_dispositivo)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_sensores_estado
        CHECK (estado IN ('activo', 'inactivo', 'calibracion', 'fallo'))
);

CREATE TABLE lecturas_sensor (
    id_lectura BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_sensor INTEGER NOT NULL,
    valor NUMERIC(12,4) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    calidad_dato VARCHAR(20) NOT NULL DEFAULT 'valido',
    observacion TEXT,
    CONSTRAINT fk_lecturas_sensor_sensores
        FOREIGN KEY (id_sensor) REFERENCES sensores(id_sensor)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_lecturas_calidad
        CHECK (calidad_dato IN ('valido', 'estimado', 'atipico', 'error'))
);

CREATE TABLE estados_dispositivo (
    id_estado BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_dispositivo INTEGER NOT NULL,
    estado VARCHAR(20) NOT NULL,
    bateria NUMERIC(5,2),
    conectividad VARCHAR(20),
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_estados_dispositivo_dispositivos
        FOREIGN KEY (id_dispositivo) REFERENCES dispositivos(id_dispositivo)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_estados_dispositivo_estado
        CHECK (estado IN ('activo', 'inactivo', 'mantenimiento', 'fallo')),
    CONSTRAINT chk_estados_dispositivo_bateria
        CHECK (bateria IS NULL OR (bateria >= 0 AND bateria <= 100)),
    CONSTRAINT chk_estados_dispositivo_conectividad
        CHECK (conectividad IS NULL OR conectividad IN ('online', 'offline', 'intermitente'))
);

CREATE TABLE captacion_agua (
    id_captacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_atrapanieblas INTEGER NOT NULL,
    id_tanque INTEGER NOT NULL,
    volumen_litros NUMERIC(10,2) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT,
    CONSTRAINT fk_captacion_atrapanieblas
        FOREIGN KEY (id_atrapanieblas) REFERENCES atrapanieblas(id_atrapanieblas)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_captacion_tanques
        FOREIGN KEY (id_tanque) REFERENCES tanques(id_tanque)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_captacion_volumen
        CHECK (volumen_litros >= 0)
);

CREATE TABLE transferencias_agua (
    id_transferencia BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_tanque_origen INTEGER NOT NULL,
    id_invernadero INTEGER NOT NULL,
    volumen_litros NUMERIC(10,2) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metodo VARCHAR(30),
    observacion TEXT,
    CONSTRAINT fk_transferencias_tanque
        FOREIGN KEY (id_tanque_origen) REFERENCES tanques(id_tanque)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_transferencias_invernadero
        FOREIGN KEY (id_invernadero) REFERENCES invernaderos(id_invernadero)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_transferencias_volumen
        CHECK (volumen_litros > 0)
);

CREATE TABLE riegos (
    id_riego BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_invernadero INTEGER NOT NULL,
    fecha_hora_inicio TIMESTAMP NOT NULL,
    fecha_hora_fin TIMESTAMP,
    volumen_aplicado NUMERIC(10,2) NOT NULL DEFAULT 0,
    modo VARCHAR(20) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ejecutado',
    CONSTRAINT fk_riegos_invernaderos
        FOREIGN KEY (id_invernadero) REFERENCES invernaderos(id_invernadero)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_riegos_volumen
        CHECK (volumen_aplicado >= 0),
    CONSTRAINT chk_riegos_modo
        CHECK (modo IN ('manual', 'automatico', 'recomendado_ml')),
    CONSTRAINT chk_riegos_estado
        CHECK (estado IN ('programado', 'ejecutado', 'cancelado', 'fallido')),
    CONSTRAINT chk_riegos_fechas
        CHECK (fecha_hora_fin IS NULL OR fecha_hora_fin >= fecha_hora_inicio)
);

CREATE TABLE programacion_riego (
    id_programacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_invernadero INTEGER NOT NULL,
    frecuencia VARCHAR(50) NOT NULL,
    horario TIME NOT NULL,
    volumen_estimado NUMERIC(10,2),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    CONSTRAINT fk_programacion_riego_invernaderos
        FOREIGN KEY (id_invernadero) REFERENCES invernaderos(id_invernadero)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_programacion_volumen
        CHECK (volumen_estimado IS NULL OR volumen_estimado >= 0),
    CONSTRAINT chk_programacion_estado
        CHECK (estado IN ('activo', 'inactivo'))
);

CREATE TABLE predicciones (
    id_prediccion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_invernadero INTEGER,
    tipo_prediccion VARCHAR(50) NOT NULL,
    valor_predicho NUMERIC(12,4) NOT NULL,
    periodo_inicio TIMESTAMP NOT NULL,
    periodo_fin TIMESTAMP NOT NULL,
    modelo_usado VARCHAR(100) NOT NULL,
    fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_predicciones_invernaderos
        FOREIGN KEY (id_invernadero) REFERENCES invernaderos(id_invernadero)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_predicciones_periodo
        CHECK (periodo_fin >= periodo_inicio)
);

CREATE TABLE escenarios (
    id_escenario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    nivel_riesgo VARCHAR(20) NOT NULL,
    fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_escenarios_nivel_riesgo
        CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto', 'critico'))
);

CREATE TABLE recomendaciones (
    id_recomendacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_prediccion BIGINT NOT NULL,
    id_invernadero INTEGER,
    accion_sugerida TEXT NOT NULL,
    prioridad VARCHAR(20) NOT NULL DEFAULT 'media',
    fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recomendaciones_predicciones
        FOREIGN KEY (id_prediccion) REFERENCES predicciones(id_prediccion)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_recomendaciones_invernaderos
        FOREIGN KEY (id_invernadero) REFERENCES invernaderos(id_invernadero)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_recomendaciones_prioridad
        CHECK (prioridad IN ('baja', 'media', 'alta', 'critica'))
);

CREATE TABLE alertas (
    id_alerta BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_sensor INTEGER,
    id_dispositivo INTEGER,
    tipo_alerta VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    severidad VARCHAR(20) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alertas_sensores
        FOREIGN KEY (id_sensor) REFERENCES sensores(id_sensor)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_alertas_dispositivos
        FOREIGN KEY (id_dispositivo) REFERENCES dispositivos(id_dispositivo)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_alertas_severidad
        CHECK (severidad IN ('info', 'baja', 'media', 'alta', 'critica')),
    CONSTRAINT chk_alertas_estado
        CHECK (estado IN ('pendiente', 'atendida', 'cerrada')),
    CONSTRAINT chk_alertas_origen
        CHECK (id_sensor IS NOT NULL OR id_dispositivo IS NOT NULL)
);

CREATE TABLE configuraciones (
    id_configuracion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion TEXT,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logs_sistema (
    id_log BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario INTEGER,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(100) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detalle TEXT,
    CONSTRAINT fk_logs_usuarios
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX idx_usuarios_id_rol ON usuarios(id_rol);
CREATE INDEX idx_sensores_id_dispositivo ON sensores(id_dispositivo);
CREATE INDEX idx_lecturas_sensor_id_sensor ON lecturas_sensor(id_sensor);
CREATE INDEX idx_lecturas_sensor_fecha_hora ON lecturas_sensor(fecha_hora);
CREATE INDEX idx_estados_dispositivo_id_dispositivo ON estados_dispositivo(id_dispositivo);
CREATE INDEX idx_estados_dispositivo_fecha_hora ON estados_dispositivo(fecha_hora);
CREATE INDEX idx_captacion_agua_id_atrapanieblas ON captacion_agua(id_atrapanieblas);
CREATE INDEX idx_captacion_agua_id_tanque ON captacion_agua(id_tanque);
CREATE INDEX idx_captacion_agua_fecha_hora ON captacion_agua(fecha_hora);
CREATE INDEX idx_transferencias_agua_id_invernadero ON transferencias_agua(id_invernadero);
CREATE INDEX idx_transferencias_agua_fecha_hora ON transferencias_agua(fecha_hora);
CREATE INDEX idx_riegos_id_invernadero ON riegos(id_invernadero);
CREATE INDEX idx_riegos_fecha_hora_inicio ON riegos(fecha_hora_inicio);
CREATE INDEX idx_programacion_riego_id_invernadero ON programacion_riego(id_invernadero);
CREATE INDEX idx_predicciones_id_invernadero ON predicciones(id_invernadero);
CREATE INDEX idx_predicciones_periodo ON predicciones(periodo_inicio, periodo_fin);
CREATE INDEX idx_recomendaciones_id_prediccion ON recomendaciones(id_prediccion);
CREATE INDEX idx_alertas_id_sensor ON alertas(id_sensor);
CREATE INDEX idx_alertas_id_dispositivo ON alertas(id_dispositivo);
CREATE INDEX idx_alertas_fecha_hora ON alertas(fecha_hora);
CREATE INDEX idx_logs_sistema_id_usuario ON logs_sistema(id_usuario);
CREATE INDEX idx_logs_sistema_fecha_hora ON logs_sistema(fecha_hora);

INSERT INTO roles (nombre, descripcion) VALUES
('administrador', 'Control total del sistema'),
('tecnico', 'Gestión técnica, monitoreo y mantenimiento'),
('docente', 'Consulta académica y supervisión'),
('estudiante', 'Consulta operativa y seguimiento');

INSERT INTO configuraciones (clave, valor, descripcion) VALUES
('intervalo_lectura_segundos', '300', 'Intervalo de lectura de sensores en segundos'),
('umbral_alerta_humedad_baja', '30', 'Umbral de humedad baja para generar alertas'),
('modo_riego_default', 'automatico', 'Modo de riego predeterminado del sistema');

COMMIT;