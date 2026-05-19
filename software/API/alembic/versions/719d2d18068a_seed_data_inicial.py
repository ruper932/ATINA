"""seed_data_inicial

Revision ID: 719d2d18068a
Revises: f4760bbf2728
Create Date: 2026-05-07 19:01:31.425667

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '719d2d18068a'
down_revision: Union[str, Sequence[str], None] = 'f4760bbf2728'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =========================================================
    # 1. Catálogos básicos (incluyendo los faltantes)
    # =========================================================
    op.execute("""
        INSERT INTO roles (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('admin', 'Administrador del sistema'),
            ('tecnico', 'Técnico de riego y mantenimiento'),
            ('docente', 'Docente del CEA'),
            ('estudiante', 'Estudiante para fines pedagógicos')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM roles WHERE roles.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO estados_usuario (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('activo', 'Usuario habilitado'),
            ('inactivo', 'Usuario deshabilitado')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM estados_usuario WHERE estados_usuario.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO tipos_ubicacion (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('campus', 'Predio principal del CEA'),
            ('sector', 'Área dentro del campus'),
            ('invernadero', 'Estructura para cultivo'),
            ('atrapaniebla', 'Punto de captación de niebla'),
            ('laboratorio', 'Sala de servidores y monitoreo')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM tipos_ubicacion WHERE tipos_ubicacion.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO estados_invernadero (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('activo', 'En operación normal'),
            ('mantenimiento', 'En revisión')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM estados_invernadero WHERE estados_invernadero.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO estados_atrapaniebla (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('activo', 'Captando niebla normalmente'),
            ('limpieza', 'Malla en limpieza')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM estados_atrapaniebla WHERE estados_atrapaniebla.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO tipos_fuente_agua (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('manantial', 'Ojo de agua comunitario'),
            ('atrapaniebla', 'Agua captada por mallas')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM tipos_fuente_agua WHERE tipos_fuente_agua.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO estados_fuente_agua (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('activo', 'Disponible'),
            ('seco', 'Sin caudal temporal')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM estados_fuente_agua WHERE estados_fuente_agua.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO tipos_dispositivo (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('ESP32', 'Microcontrolador con WiFi/BLE'),
            ('Servidor MCP', 'Servidor local de interoperabilidad'),
            ('Gateway', 'Puente de red local')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM tipos_dispositivo WHERE tipos_dispositivo.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO estados_dispositivo (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('activo', 'Funcionando'),
            ('falla', 'Con problemas de comunicación')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM estados_dispositivo WHERE estados_dispositivo.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO tipos_sensor (nombre, variable_medida, unidad_base, descripcion)
        SELECT * FROM (VALUES 
            ('BME680 Temperatura', 'temperatura', 'C', 'Sensor de temperatura'),
            ('BME680 Presion', 'presion_atmosferica', 'hPa', 'Presión barométrica'),
            ('BME680 Humedad', 'humedad_relativa', '%', 'Humedad relativa'),
            ('Caudalimetro', 'caudal', 'L/min', 'Flujo de agua en tubería')
        ) AS v(nombre, variable_medida, unidad_base, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM tipos_sensor WHERE tipos_sensor.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO calidades_dato (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('valido', 'Lectura confiable'),
            ('estimado', 'Valor interpolado')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM calidades_dato WHERE calidades_dato.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO origenes_decision (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('ml2', 'Modelo ML2 de riego edge'),
            ('manual', 'Operador humano')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM origenes_decision WHERE origenes_decision.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO modos_riego (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('automatico', 'Controlado por ML2'),
            ('manual', 'Accionado por técnico')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM modos_riego WHERE modos_riego.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO estados_valvula (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('abierta', 'Flujo activo'),
            ('cerrada', 'Flujo detenido')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM estados_valvula WHERE estados_valvula.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO modelos_ml (nombre, tipo_modelo, version, objetivo, framework, descripcion, activo)
        SELECT * FROM (VALUES 
            ('ML1', 'regresion', '1.0', 'prediccion_volumen_diario', 'scikit-learn', 'Predice litros captados por día', true),
            ('ML2', 'clasificacion', '1.0', 'calculo_riego_edge', 'microPython', 'Decide apertura/cierre en ESP32', true),
            ('ML3', 'simulacion', '1.0', 'escenarios_hidricos', 'Python', 'Gemelo digital educativo', true)
        ) AS v(nombre, tipo_modelo, version, objetivo, framework, descripcion, activo)
        WHERE NOT EXISTS (SELECT 1 FROM modelos_ml WHERE modelos_ml.nombre = v.nombre AND modelos_ml.version = v.version);
    """)

    # =========================================================
    # Catálogos faltantes (estados sensores, actuadores, alertas, sincronización)
    # =========================================================
    op.execute("""
        INSERT INTO estados_sensor (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('activo', 'Sensor funcionando correctamente'),
            ('inactivo', 'Sensor fuera de servicio'),
            ('mantenimiento', 'Sensor en calibración o reparación')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM estados_sensor WHERE estados_sensor.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO estados_actuador (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('operativo', 'Actuador funcionando'),
            ('falla', 'Actuador con problemas'),
            ('desconectado', 'Sin comunicación')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM estados_actuador WHERE estados_actuador.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO severidades_alerta (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('baja', 'Informativa, no requiere acción inmediata'),
            ('media', 'Requiere atención pronto'),
            ('advertencia', 'Posible problema, monitorear'),
            ('alta', 'Acción inmediata requerida'),
            ('critica', 'Emergencia')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM severidades_alerta WHERE severidades_alerta.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO origenes_alerta (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('sensor', 'Generada por lecturas de sensores'),
            ('ml2', 'Generada por modelo ML2'),
            ('sistema', 'Generada por el backend')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM origenes_alerta WHERE origenes_alerta.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO estados_alerta (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('activa', 'Alerta no atendida'),
            ('reconocida', 'Vista por un usuario'),
            ('resuelta', 'Problema solucionado'),
            ('desestimada', 'Falso positivo')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM estados_alerta WHERE estados_alerta.nombre = v.nombre);
    """)
    op.execute("""
        INSERT INTO estados_sincronizacion (nombre, descripcion)
        SELECT * FROM (VALUES 
            ('exito', 'Sincronización completada correctamente'),
            ('error', 'Falló la sincronización'),
            ('en_proceso', 'Enviando datos')
        ) AS v(nombre, descripcion)
        WHERE NOT EXISTS (SELECT 1 FROM estados_sincronizacion WHERE estados_sincronizacion.nombre = v.nombre);
    """)

    # =========================================================
    # 2. Usuarios (con CI en lugar de ID y todas las columnas NOT NULL de 2FA)
    # =========================================================
    op.execute("""
        INSERT INTO users (ci, username, email, hashed_password, is_active, is_superuser, rol_id, estado_usuario_id, is_totp_enabled, is_email_2fa_enabled)
        SELECT 
            '1234567', 'admin_cea', 'admin@cea.edu', 'fake_hash_para_pruebas', true, true, 
            (SELECT id FROM roles WHERE nombre = 'admin'),
            (SELECT id FROM estados_usuario WHERE nombre = 'activo'),
            false, false
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin_cea');
    """)
    op.execute("""
        INSERT INTO users (ci, username, email, hashed_password, is_active, is_superuser, rol_id, estado_usuario_id, is_totp_enabled, is_email_2fa_enabled)
        SELECT 
            '7654321', 'tecnico_luis', 'tecnico@cea.edu', 'fake_hash_para_pruebas', true, false,
            (SELECT id FROM roles WHERE nombre = 'tecnico'),
            (SELECT id FROM estados_usuario WHERE nombre = 'activo'),
            false, false
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'tecnico_luis');
    """)

    # Perfiles
    op.execute("""
        INSERT INTO perfiles (user_ci, nombres, apellido_paterno, apellido_materno, telefono, cargo)
        SELECT u.ci, 'Administrador', 'Sistema', NULL, '77777777', 'Admin Local'
        FROM users u WHERE u.username = 'admin_cea'
        AND NOT EXISTS (SELECT 1 FROM perfiles WHERE user_ci = u.ci);
    """)
    op.execute("""
        INSERT INTO perfiles (user_ci, nombres, apellido_paterno, apellido_materno, telefono, cargo)
        SELECT u.ci, 'Luis', 'Mamani', NULL, '78888888', 'Técnico de Riego'
        FROM users u WHERE u.username = 'tecnico_luis'
        AND NOT EXISTS (SELECT 1 FROM perfiles WHERE user_ci = u.ci);
    """)

    # =========================================================
    # 3. Ubicaciones (jerarquía)
    # =========================================================
    op.execute("""
        INSERT INTO ubicaciones (tipo_ubicacion_id, nombre, descripcion, latitud, longitud, altitud_m)
        SELECT 
            (SELECT id FROM tipos_ubicacion WHERE nombre = 'campus'),
            'CEA Ildefonso de las Muñecas', 'Campus central en Titicachi',
            -15.893, -68.924, 3850
        WHERE NOT EXISTS (SELECT 1 FROM ubicaciones WHERE nombre = 'CEA Ildefonso de las Muñecas');
    """)
    op.execute("""
        INSERT INTO ubicaciones (tipo_ubicacion_id, ubicacion_padre_id, nombre, descripcion)
        SELECT 
            (SELECT id FROM tipos_ubicacion WHERE nombre = 'sector'),
            (SELECT id FROM ubicaciones WHERE nombre = 'CEA Ildefonso de las Muñecas'),
            'Zona de Invernaderos', 'Área productiva'
        WHERE NOT EXISTS (SELECT 1 FROM ubicaciones WHERE nombre = 'Zona de Invernaderos');
    """)

    # Invernaderos: usamos un bloque DO para evitar el error de la columna i
    op.execute("""
        DO $$
        DECLARE
            padre_id integer;
            tipo_inv_id integer;
            i integer;
            lat_base numeric := -15.8925;
            lng_base numeric := -68.9235;
        BEGIN
            SELECT id INTO padre_id FROM ubicaciones WHERE nombre = 'Zona de Invernaderos';
            SELECT id INTO tipo_inv_id FROM tipos_ubicacion WHERE nombre = 'invernadero';
            FOR i IN 1..4 LOOP
                INSERT INTO ubicaciones (tipo_ubicacion_id, ubicacion_padre_id, nombre, latitud, longitud)
                SELECT tipo_inv_id, padre_id, 'Invernadero ' || i, lat_base + (i*0.0001), lng_base
                WHERE NOT EXISTS (SELECT 1 FROM ubicaciones WHERE nombre = 'Invernadero ' || i);
            END LOOP;
        END $$;
    """)

    op.execute("""
        INSERT INTO ubicaciones (tipo_ubicacion_id, ubicacion_padre_id, nombre, latitud, longitud, altitud_m)
        SELECT 
            (SELECT id FROM tipos_ubicacion WHERE nombre = 'atrapaniebla'),
            (SELECT id FROM ubicaciones WHERE nombre = 'CEA Ildefonso de las Muñecas'),
            'Atrapaniebla Norte', -15.890, -68.922, 3880
        WHERE NOT EXISTS (SELECT 1 FROM ubicaciones WHERE nombre = 'Atrapaniebla Norte');
    """)
    op.execute("""
        INSERT INTO ubicaciones (tipo_ubicacion_id, ubicacion_padre_id, nombre, latitud, longitud, altitud_m)
        SELECT 
            (SELECT id FROM tipos_ubicacion WHERE nombre = 'atrapaniebla'),
            (SELECT id FROM ubicaciones WHERE nombre = 'CEA Ildefonso de las Muñecas'),
            'Atrapaniebla Sur', -15.896, -68.926, 3820
        WHERE NOT EXISTS (SELECT 1 FROM ubicaciones WHERE nombre = 'Atrapaniebla Sur');
    """)
    op.execute("""
        INSERT INTO ubicaciones (tipo_ubicacion_id, ubicacion_padre_id, nombre)
        SELECT 
            (SELECT id FROM tipos_ubicacion WHERE nombre = 'laboratorio'),
            (SELECT id FROM ubicaciones WHERE nombre = 'CEA Ildefonso de las Muñecas'),
            'Laboratorio de Sistemas'
        WHERE NOT EXISTS (SELECT 1 FROM ubicaciones WHERE nombre = 'Laboratorio de Sistemas');
    """)

    # =========================================================
    # 4. Invernaderos (detalles)
    # =========================================================
    for i in range(1, 5):
        op.execute(f"""
            INSERT INTO invernaderos (ubicacion_id, codigo, nombre, area_m2, prioridad_riego, estado_invernadero_id)
            SELECT 
                (SELECT id FROM ubicaciones WHERE nombre = 'Invernadero {i}'),
                'INV-{i:02d}', 'Invernadero {i}', 120 + ({i}*10), {i},
                (SELECT id FROM estados_invernadero WHERE nombre = 'activo')
            WHERE NOT EXISTS (SELECT 1 FROM invernaderos WHERE codigo = 'INV-{i:02d}');
        """)

    # =========================================================
    # 5. Atrapanieblas
    # =========================================================
    op.execute("""
        INSERT INTO atrapanieblas (ubicacion_id, codigo, nombre, area_malla_m2, tipo_malla, orientacion, estado_atrapaniebla_id)
        SELECT 
            (SELECT id FROM ubicaciones WHERE nombre = 'Atrapaniebla Norte'),
            'ATR-NORTE', 'Malla Norte', 20, 'Raschel 35%', 'Norte-Sur',
            (SELECT id FROM estados_atrapaniebla WHERE nombre = 'activo')
        WHERE NOT EXISTS (SELECT 1 FROM atrapanieblas WHERE codigo = 'ATR-NORTE');
    """)
    op.execute("""
        INSERT INTO atrapanieblas (ubicacion_id, codigo, nombre, area_malla_m2, tipo_malla, orientacion, estado_atrapaniebla_id)
        SELECT 
            (SELECT id FROM ubicaciones WHERE nombre = 'Atrapaniebla Sur'),
            'ATR-SUR', 'Malla Sur', 20, 'Raschel 35%', 'Este-Oeste',
            (SELECT id FROM estados_atrapaniebla WHERE nombre = 'activo')
        WHERE NOT EXISTS (SELECT 1 FROM atrapanieblas WHERE codigo = 'ATR-SUR');
    """)

    # =========================================================
    # 6. Fuentes de agua
    # =========================================================
    op.execute("""
        INSERT INTO fuentes_agua (tipo_fuente_agua_id, codigo, nombre, capacidad_l, estado_fuente_agua_id)
        SELECT 
            (SELECT id FROM tipos_fuente_agua WHERE nombre = 'manantial'),
            'MANANTIAL-01', 'Ojo de agua comunitario', 50000,
            (SELECT id FROM estados_fuente_agua WHERE nombre = 'activo')
        WHERE NOT EXISTS (SELECT 1 FROM fuentes_agua WHERE codigo = 'MANANTIAL-01');
    """)
    op.execute("""
        INSERT INTO fuentes_agua (tipo_fuente_agua_id, codigo, nombre, capacidad_l, estado_fuente_agua_id)
        SELECT 
            (SELECT id FROM tipos_fuente_agua WHERE nombre = 'atrapaniebla'),
            'F-ATR-NORTE', 'Agua captada norte', 2000,
            (SELECT id FROM estados_fuente_agua WHERE nombre = 'activo')
        WHERE NOT EXISTS (SELECT 1 FROM fuentes_agua WHERE codigo = 'F-ATR-NORTE');
    """)
    op.execute("""
        INSERT INTO fuentes_agua_atrapanieblas (fuente_agua_id, atrapaniebla_id)
        SELECT 
            (SELECT id FROM fuentes_agua WHERE codigo = 'F-ATR-NORTE'),
            (SELECT id FROM atrapanieblas WHERE codigo = 'ATR-NORTE')
        WHERE NOT EXISTS (SELECT 1 FROM fuentes_agua_atrapanieblas 
            WHERE fuente_agua_id = (SELECT id FROM fuentes_agua WHERE codigo = 'F-ATR-NORTE')
            AND atrapaniebla_id = (SELECT id FROM atrapanieblas WHERE codigo = 'ATR-NORTE'));
    """)

    # =========================================================
    # 7. Dispositivos y sensores
    # =========================================================
    op.execute("""
        INSERT INTO dispositivos (tipo_dispositivo_id, codigo, nombre, estado_dispositivo_id)
        SELECT 
            (SELECT id FROM tipos_dispositivo WHERE nombre = 'ESP32'),
            'ESP-CAP-NORTE', 'ESP32 Captación Norte',
            (SELECT id FROM estados_dispositivo WHERE nombre = 'activo')
        WHERE NOT EXISTS (SELECT 1 FROM dispositivos WHERE codigo = 'ESP-CAP-NORTE');
    """)
    sensores_data = [
        ('BME680 Temperatura', 'TEMP-NORTE', 'Sensor temperatura norte'),
        ('BME680 Presion', 'PRES-NORTE', 'Sensor presión norte'),
        ('BME680 Humedad', 'HUM-NORTE', 'Sensor humedad norte'),
        ('Caudalimetro', 'CAUD-NORTE', 'Caudalímetro norte')
    ]
    for nombre_tipo, codigo, desc in sensores_data:
        op.execute(f"""
            INSERT INTO sensores (dispositivo_id, tipo_sensor_id, codigo, nombre, estado_sensor_id)
            SELECT 
                (SELECT id FROM dispositivos WHERE codigo = 'ESP-CAP-NORTE'),
                (SELECT id FROM tipos_sensor WHERE nombre = '{nombre_tipo}'),
                '{codigo}', '{desc}',
                (SELECT id FROM estados_sensor WHERE nombre = 'activo')
            WHERE NOT EXISTS (SELECT 1 FROM sensores WHERE codigo = '{codigo}');
        """)

    # =========================================================
    # 8. Lecturas masivas (30 días, cada 10 min)
    # =========================================================
    op.execute("""
        DO $$
        DECLARE
            sensor_record RECORD;
            start_time TIMESTAMPTZ := '2026-04-01 00:00:00';
            end_time TIMESTAMPTZ := '2026-04-30 23:59:59';
        BEGIN
            FOR sensor_record IN 
                SELECT s.id, ts.unidad_base 
                FROM sensores s
                JOIN tipos_sensor ts ON s.tipo_sensor_id = ts.id
                WHERE s.codigo IN ('TEMP-NORTE', 'PRES-NORTE', 'HUM-NORTE', 'CAUD-NORTE')
            LOOP
                IF (SELECT COUNT(*) FROM lecturas_sensor WHERE sensor_id = sensor_record.id AND timestamp_lectura >= start_time) = 0 THEN
                    INSERT INTO lecturas_sensor (sensor_id, valor, calidad_dato_id, timestamp_lectura)
                    SELECT 
                        sensor_record.id,
                        CASE 
                            WHEN sensor_record.unidad_base = 'C' THEN 8 + random() * 12
                            WHEN sensor_record.unidad_base = 'hPa' THEN 750 + random() * 30
                            WHEN sensor_record.unidad_base = '%' THEN 30 + random() * 60
                            WHEN sensor_record.unidad_base = 'L/min' THEN 0.2 + random() * 3
                            ELSE 0
                        END,
                        (SELECT id FROM calidades_dato WHERE nombre = 'valido'),
                        generate_series
                    FROM generate_series(start_time, end_time, INTERVAL '10 minutes') AS generate_series
                    WHERE NOT EXISTS (
                        SELECT 1 FROM lecturas_sensor ls 
                        WHERE ls.sensor_id = sensor_record.id AND ls.timestamp_lectura = generate_series
                    );
                END IF;
            END LOOP;
        END $$;
    """)

    # =========================================================
    # 9. Predicciones ML1 diarias (30 días)
    # =========================================================
    op.execute("""
        INSERT INTO predicciones_ml (modelo_ml_id, fuente_agua_id, fecha_prediccion, fecha_objetivo, volumen_predicho_l, confianza_modelo)
        SELECT 
            (SELECT id FROM modelos_ml WHERE nombre = 'ML1'),
            (SELECT id FROM fuentes_agua WHERE codigo = 'F-ATR-NORTE'),
            now()::date,
            dia,
            150 + (random() * 100)::numeric(14,4),
            70 + (random() * 25)::numeric(5,2)
        FROM generate_series(now()::date, now()::date + interval '29 days', interval '1 day') AS dia
        WHERE NOT EXISTS (
            SELECT 1 FROM predicciones_ml 
            WHERE modelo_ml_id = (SELECT id FROM modelos_ml WHERE nombre = 'ML1')
            AND fuente_agua_id = (SELECT id FROM fuentes_agua WHERE codigo = 'F-ATR-NORTE')
            AND fecha_objetivo = dia
        );
    """)

    # =========================================================
    # 10. Decisiones de riego aleatorias (últimos 30 días)
    # =========================================================
    op.execute("""
        DO $$
        DECLARE
            invernadero_ids INTEGER[];
            inv_id INTEGER;
            decision_id INTEGER;
            decision_time TIMESTAMPTZ;
        BEGIN
            SELECT ARRAY(SELECT id FROM invernaderos) INTO invernadero_ids;
            FOR i IN 1..100 LOOP
                decision_time := now() - (random() * interval '30 days');
                INSERT INTO decisiones_riego (origen_decision_id, modo_riego_id, estado_valvula_id, texto_decision, ejecutado_en)
                SELECT 
                    (SELECT id FROM origenes_decision WHERE nombre = 'ml2'),
                    (SELECT id FROM modos_riego WHERE nombre = 'automatico'),
                    (CASE WHEN random() < 0.7 THEN (SELECT id FROM estados_valvula WHERE nombre = 'abierta') ELSE (SELECT id FROM estados_valvula WHERE nombre = 'cerrada') END),
                    'Decisión automática basada en ML2 con volumen ' || (round(random()*100)::text) || ' L',
                    decision_time
                WHERE NOT EXISTS (SELECT 1 FROM decisiones_riego WHERE ejecutado_en = decision_time)
                RETURNING id INTO decision_id;
                
                inv_id := invernadero_ids[1 + floor(random() * array_length(invernadero_ids, 1))];
                INSERT INTO decisiones_riego_invernaderos (decision_riego_id, invernadero_id)
                SELECT decision_id, inv_id
                WHERE NOT EXISTS (SELECT 1 FROM decisiones_riego_invernaderos WHERE decision_riego_id = decision_id);
                
                INSERT INTO eventos_riego (decision_riego_id, inicio_evento, duracion_segundos, observaciones)
                SELECT decision_id, decision_time, (random() * 600 + 30)::int, 'Riego automático ejecutado'
                WHERE (SELECT estado_valvula_id FROM decisiones_riego WHERE id = decision_id) = (SELECT id FROM estados_valvula WHERE nombre = 'abierta');
            END LOOP;
        END $$;
    """)

    # =========================================================
    # 11. Alertas de ejemplo (usando los catálogos insertados)
    # =========================================================
    op.execute("""
        INSERT INTO alertas (tipo_alerta, severidad_alerta_id, origen_alerta_id, mensaje, estado_alerta_id, fecha_generacion)
        SELECT 
            'CAUDAL_BAJO',
            (SELECT id FROM severidades_alerta WHERE nombre = 'advertencia'),
            (SELECT id FROM origenes_alerta WHERE nombre = 'sensor'),
            'El caudalímetro del atrapaniebla norte registró valores por debajo de 1 L/min durante 3 horas.',
            (SELECT id FROM estados_alerta WHERE nombre = 'activa'),
            now() - interval '2 days'
        WHERE NOT EXISTS (SELECT 1 FROM alertas WHERE mensaje LIKE '%debajo de 1 L/min%');
    """)
    op.execute("""
        INSERT INTO alertas (tipo_alerta, severidad_alerta_id, origen_alerta_id, mensaje, estado_alerta_id, fecha_generacion)
        SELECT 
            'RIEGO_EXCESIVO',
            (SELECT id FROM severidades_alerta WHERE nombre = 'alta'),
            (SELECT id FROM origenes_alerta WHERE nombre = 'ml2'),
            'ML2 calculó un riego de 300 L para INV-01, pero la fuente solo tenía 150 L. Se ejecutó riego parcial.',
            (SELECT id FROM estados_alerta WHERE nombre = 'reconocida'),
            now() - interval '1 day'
        WHERE NOT EXISTS (SELECT 1 FROM alertas WHERE mensaje LIKE 'ML2 calculó%');
    """)

    # =========================================================
    # 12. Sincronizaciones MCP
    # =========================================================
    op.execute("""
        INSERT INTO sincronizaciones_mcp (estado_sincronizacion_id, origen, destino, tipo_recurso, cantidad_registros, fecha_inicio, fecha_fin, mensaje_resultado)
        SELECT 
            (SELECT id FROM estados_sincronizacion WHERE nombre = 'exito'),
            'sensor_ESP_CAP_NORTE', 'servidor_MCP_local', 'lecturas_sensor',
            144,
            now() - interval '1 day',
            now() - interval '1 day' + interval '15 minutes',
            'Sincronización completa diaria'
        WHERE NOT EXISTS (SELECT 1 FROM sincronizaciones_mcp WHERE origen = 'sensor_ESP_CAP_NORTE' AND fecha_inicio > now() - interval '2 days');
    """)

    # =========================================================
    # 13. Reporte semanal de ejemplo
    # =========================================================
    op.execute("""
        INSERT INTO reportes_semanales (periodo_inicio, periodo_fin, volumen_captado_l, volumen_predicho_l, eficiencia_riego, total_alertas, resumen, generado_por_ci)
        SELECT 
            (now() - interval '7 days')::date,
            now()::date,
            1250, 1380, 87.5, 3, 'Semana normal, caudal dentro de lo esperado',
            (SELECT ci FROM users WHERE username = 'admin_cea')
        WHERE NOT EXISTS (SELECT 1 FROM reportes_semanales WHERE periodo_inicio = (now() - interval '7 days')::date);
    """)


def downgrade() -> None:
    # Nota: no se implementa downgrade para datos semilla, pero se puede añadir si se requiere.
    pass