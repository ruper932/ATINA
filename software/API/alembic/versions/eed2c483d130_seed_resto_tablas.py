"""seed_resto_tablas

Revision ID: eed2c483d130
Revises: 719d2d18068a
Create Date: 2026-05-07 19:32:55.047782

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eed2c483d130'
down_revision: Union[str, Sequence[str], None] = '719d2d18068a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =========================================================
    # 0. Asegurar catálogos necesarios para esta migración
    # =========================================================
    op.execute("""
        INSERT INTO tipos_actuador (nombre, descripcion)
        SELECT 'Válvula solenoide', 'Actuador para control de flujo de agua'
        WHERE NOT EXISTS (SELECT 1 FROM tipos_actuador WHERE nombre = 'Válvula solenoide');
    """)
    # Aseguramos que exista el estado 'activo' en estados_actuador (aunque en seed_data_inicial se crearon 'operativo', 'falla', 'desconectado')
    op.execute("""
        INSERT INTO estados_actuador (nombre, descripcion)
        SELECT 'activo', 'Actuador funcionando correctamente'
        WHERE NOT EXISTS (SELECT 1 FROM estados_actuador WHERE nombre = 'activo');
    """)
    # Aseguramos que existan los ámbitos de umbral necesarios
    op.execute("""
        INSERT INTO ambitos_umbral (nombre, descripcion)
        SELECT 'global', 'Configuración aplicable a todo el sistema'
        WHERE NOT EXISTS (SELECT 1 FROM ambitos_umbral WHERE nombre = 'global');
    """)
    op.execute("""
        INSERT INTO ambitos_umbral (nombre, descripcion)
        SELECT 'invernadero', 'Configuración específica por invernadero'
        WHERE NOT EXISTS (SELECT 1 FROM ambitos_umbral WHERE nombre = 'invernadero');
    """)
    op.execute("""
        INSERT INTO tipos_notificacion (nombre, descripcion)
        SELECT 'pantalla', 'Notificación mostrada en el dashboard'
        WHERE NOT EXISTS (SELECT 1 FROM tipos_notificacion WHERE nombre = 'pantalla');
    """)
    op.execute("""
        INSERT INTO estados_envio (nombre, descripcion)
        SELECT 'confirmado', 'Notificación vista y confirmada'
        WHERE NOT EXISTS (SELECT 1 FROM estados_envio WHERE nombre = 'confirmado');
    """)

    # =========================================================
    # 1. ACTUADORES (válvulas de riego)
    # =========================================================
    op.execute("""
        DO $$
        DECLARE
            dispositivo_id integer;
            tipo_act_id integer;
            estado_act_id integer;
        BEGIN
            SELECT id INTO dispositivo_id FROM dispositivos WHERE codigo = 'ESP-CAP-NORTE';
            SELECT id INTO tipo_act_id FROM tipos_actuador WHERE nombre = 'Válvula solenoide';
            SELECT id INTO estado_act_id FROM estados_actuador WHERE nombre = 'activo';
            
            -- Válvula para el invernadero 1
            INSERT INTO actuadores (dispositivo_id, tipo_actuador_id, codigo, nombre, estado_actuador_id, fecha_instalacion)
            SELECT dispositivo_id, tipo_act_id, 'VALV-INV-01', 'Válvula Invernadero 1', estado_act_id, '2026-04-01'
            WHERE NOT EXISTS (SELECT 1 FROM actuadores WHERE codigo = 'VALV-INV-01');
            
            -- Válvula para el invernadero 2
            INSERT INTO actuadores (dispositivo_id, tipo_actuador_id, codigo, nombre, estado_actuador_id, fecha_instalacion)
            SELECT dispositivo_id, tipo_act_id, 'VALV-INV-02', 'Válvula Invernadero 2', estado_act_id, '2026-04-01'
            WHERE NOT EXISTS (SELECT 1 FROM actuadores WHERE codigo = 'VALV-INV-02');
            
            -- Válvula para el invernadero 3
            INSERT INTO actuadores (dispositivo_id, tipo_actuador_id, codigo, nombre, estado_actuador_id, fecha_instalacion)
            SELECT dispositivo_id, tipo_act_id, 'VALV-INV-03', 'Válvula Invernadero 3', estado_act_id, '2026-04-01'
            WHERE NOT EXISTS (SELECT 1 FROM actuadores WHERE codigo = 'VALV-INV-03');
            
            -- Válvula para el invernadero 4
            INSERT INTO actuadores (dispositivo_id, tipo_actuador_id, codigo, nombre, estado_actuador_id, fecha_instalacion)
            SELECT dispositivo_id, tipo_act_id, 'VALV-INV-04', 'Válvula Invernadero 4', estado_act_id, '2026-04-01'
            WHERE NOT EXISTS (SELECT 1 FROM actuadores WHERE codigo = 'VALV-INV-04');
        END $$;
    """)
    
    # =========================================================
    # 2. ACTUADORES_INVERNADEROS (asignación histórica)
    # =========================================================
    op.execute("""
        DO $$
        DECLARE
            act_record RECORD;
            inv_id integer;
        BEGIN
            FOR act_record IN SELECT a.id, a.codigo FROM actuadores a LOOP
                -- Extraer el número del invernadero desde el código (ej: VALV-INV-01 -> 01)
                inv_id := (SELECT id FROM invernaderos WHERE codigo = 'INV-' || substring(act_record.codigo from 'INV-(\\d{2})'));
                IF inv_id IS NOT NULL THEN
                    INSERT INTO actuadores_invernaderos (actuador_id, invernadero_id, fecha_inicio, fecha_fin)
                    SELECT act_record.id, inv_id, '2026-04-01'::timestamptz, NULL
                    WHERE NOT EXISTS (
                        SELECT 1 FROM actuadores_invernaderos 
                        WHERE actuador_id = act_record.id AND invernadero_id = inv_id
                    );
                END IF;
            END LOOP;
        END $$;
    """)
    
    # =========================================================
    # 3. PARÁMETROS DE UMBRAL
    # =========================================================
    op.execute("""
        INSERT INTO parametros_umbral (nombre, descripcion, unidad)
        SELECT * FROM (VALUES 
            ('caudal_minimo', 'Caudal mínimo aceptable (L/min)', 'L/min'),
            ('humedad_maxima', 'Humedad máxima para evitar condensación excesiva', '%'),
            ('temperatura_optima', 'Temperatura óptima para invernadero', '°C'),
            ('presion_minima', 'Presión atmosférica mínima para alerta', 'hPa'),
            ('volumen_captacion_diario_minimo', 'Volumen mínimo esperado por día', 'L')
        ) AS v(nombre, descripcion, unidad)
        WHERE NOT EXISTS (SELECT 1 FROM parametros_umbral WHERE parametros_umbral.nombre = v.nombre);
    """)
    
    # =========================================================
    # 4. CONFIGURACIONES DE UMBRAL (globales)
    # =========================================================
    op.execute("""
        DO $$
        DECLARE
            param RECORD;
            ambito_global_id integer;
        BEGIN
            SELECT id INTO ambito_global_id FROM ambitos_umbral WHERE nombre = 'global';
            FOR param IN SELECT id, nombre FROM parametros_umbral LOOP
                INSERT INTO configuraciones_umbral (parametro_umbral_id, valor, ambito_umbral_id, editable, actualizado_por_ci, actualizado_en)
                SELECT 
                    param.id,
                    CASE param.nombre
                        WHEN 'caudal_minimo' THEN 1.0
                        WHEN 'humedad_maxima' THEN 85.0
                        WHEN 'temperatura_optima' THEN 22.0
                        WHEN 'presion_minima' THEN 730.0
                        WHEN 'volumen_captacion_diario_minimo' THEN 150.0
                    END,
                    ambito_global_id, true, NULL, now()
                WHERE NOT EXISTS (
                    SELECT 1 FROM configuraciones_umbral 
                    WHERE parametro_umbral_id = param.id AND ambito_umbral_id = ambito_global_id
                );
            END LOOP;
        END $$;
    """)
    
    # =========================================================
    # 5. CALIBRACIONES DE SENSORES (ejemplo)
    # =========================================================
    op.execute("""
        INSERT INTO calibraciones_sensor (sensor_id, tipo_calibracion, valor_anterior, valor_nuevo, motivo, usuario_ci, fecha_calibracion)
        SELECT 
            s.id, 'offset', NULL, 0.5, 'Ajuste inicial de fábrica',
            (SELECT ci FROM users WHERE username = 'tecnico_luis'),
            now() - interval '10 days'
        FROM sensores s
        WHERE s.codigo = 'CAUD-NORTE'
        AND NOT EXISTS (SELECT 1 FROM calibraciones_sensor WHERE sensor_id = s.id);
    """);
    
    # =========================================================
    # 6. ALERTAS ASOCIADAS A INVERNADEROS, DISPOSITIVOS, SENSORES
    # =========================================================
    op.execute("""
        DO $$
        DECLARE
            alerta_caudal_id integer;
            alerta_riego_id integer;
            inv_id integer;
        BEGIN
            SELECT id INTO alerta_caudal_id FROM alertas WHERE mensaje LIKE '%debajo de 1 L/min%' LIMIT 1;
            SELECT id INTO alerta_riego_id FROM alertas WHERE mensaje LIKE 'ML2 calculó%' LIMIT 1;
            
            FOR inv_id IN (SELECT id FROM invernaderos WHERE codigo IN ('INV-01', 'INV-02')) LOOP
                INSERT INTO alertas_invernaderos (alerta_id, invernadero_id)
                SELECT alerta_caudal_id, inv_id
                WHERE NOT EXISTS (SELECT 1 FROM alertas_invernaderos WHERE alerta_id = alerta_caudal_id AND invernadero_id = inv_id);
            END LOOP;
            
            SELECT id INTO inv_id FROM invernaderos WHERE codigo = 'INV-01';
            INSERT INTO alertas_invernaderos (alerta_id, invernadero_id)
            SELECT alerta_riego_id, inv_id
            WHERE NOT EXISTS (SELECT 1 FROM alertas_invernaderos WHERE alerta_id = alerta_riego_id AND invernadero_id = inv_id);
        END $$;
    """);
    
    op.execute("""
        INSERT INTO alertas_dispositivos (alerta_id, dispositivo_id)
        SELECT a.id, d.id
        FROM alertas a, dispositivos d
        WHERE a.mensaje LIKE '%caudalímetro%' AND d.codigo = 'ESP-CAP-NORTE'
        AND NOT EXISTS (SELECT 1 FROM alertas_dispositivos WHERE alerta_id = a.id AND dispositivo_id = d.id);
    """);
    
    op.execute("""
        INSERT INTO alertas_sensores (alerta_id, sensor_id)
        SELECT a.id, s.id
        FROM alertas a, sensores s
        WHERE a.mensaje LIKE '%caudalímetro%' AND s.codigo = 'CAUD-NORTE'
        AND NOT EXISTS (SELECT 1 FROM alertas_sensores WHERE alerta_id = a.id AND sensor_id = s.id);
    """);
    
    # =========================================================
    # 7. NOTIFICACIONES LOCALES (asociadas a alertas)
    # =========================================================
    op.execute("""
        INSERT INTO notificaciones_locales (alerta_id, tipo_notificacion_id, estado_envio_id, fecha_envio, fecha_confirmacion, detalle_respuesta)
        SELECT 
            a.id,
            (SELECT id FROM tipos_notificacion WHERE nombre = 'pantalla'),
            (SELECT id FROM estados_envio WHERE nombre = 'confirmado'),
            now() - interval '1 hour', now() - interval '50 minutes', 'Usuario reconoció la alerta'
        FROM alertas a
        WHERE a.mensaje LIKE '%caudalímetro%'
        AND NOT EXISTS (SELECT 1 FROM notificaciones_locales WHERE alerta_id = a.id)
        LIMIT 1;
    """);
    
    # =========================================================
    # 8. DECISIONES DE RIEGO FALTANTES (actuadores y fuentes)
    # =========================================================
    op.execute("""
        DO $$
        DECLARE
            dec_rec RECORD;
            act_id integer;
        BEGIN
            FOR dec_rec IN SELECT dr.id, dri.invernadero_id
                FROM decisiones_riego dr
                JOIN decisiones_riego_invernaderos dri ON dr.id = dri.decision_riego_id
                WHERE NOT EXISTS (SELECT 1 FROM decisiones_riego_actuadores WHERE decision_riego_id = dr.id)
            LOOP
                SELECT a.id INTO act_id
                FROM actuadores a
                JOIN actuadores_invernaderos ai ON a.id = ai.actuador_id
                WHERE ai.invernadero_id = dec_rec.invernadero_id
                LIMIT 1;
                
                IF act_id IS NOT NULL THEN
                    INSERT INTO decisiones_riego_actuadores (decision_riego_id, actuador_id)
                    SELECT dec_rec.id, act_id
                    WHERE NOT EXISTS (SELECT 1 FROM decisiones_riego_actuadores WHERE decision_riego_id = dec_rec.id);
                END IF;
            END LOOP;
        END $$;
    """);
    
    op.execute("""
        INSERT INTO decisiones_riego_fuentes_agua (decision_riego_id, fuente_agua_id)
        SELECT dr.id, f.id
        FROM decisiones_riego dr, fuentes_agua f
        WHERE f.codigo = 'MANANTIAL-01'
        AND NOT EXISTS (SELECT 1 FROM decisiones_riego_fuentes_agua WHERE decision_riego_id = dr.id)
        LIMIT 50;
    """);
    
    # =========================================================
    # 9. MÉTRICAS DE DECISIONES DE RIEGO
    # =========================================================
    op.execute("""
        INSERT INTO metricas_decision_riego (decision_riego_id, volumen_disponible_l, demanda_estimada_l, volumen_aplicado_l)
        SELECT 
            dr.id,
            200 + random()*100,
            80 + random()*60,
            CASE WHEN dr.estado_valvula_id = (SELECT id FROM estados_valvula WHERE nombre = 'abierta')
                THEN 80 + random()*60 ELSE 0 END
        FROM decisiones_riego dr
        WHERE NOT EXISTS (SELECT 1 FROM metricas_decision_riego WHERE decision_riego_id = dr.id)
        LIMIT 30;
    """);
    
    # =========================================================
    # 10. ESTADO ACTUAL DE RIEGO (última decisión por invernadero)
    # =========================================================
    op.execute("""
        INSERT INTO estado_riego_actual (invernadero_id, ultima_decision_id, actualizado_en)
        SELECT 
            i.id,
            (SELECT dr.id FROM decisiones_riego dr
             JOIN decisiones_riego_invernaderos dri ON dr.id = dri.decision_riego_id
             WHERE dri.invernadero_id = i.id
             ORDER BY dr.ejecutado_en DESC LIMIT 1),
            now()
        FROM invernaderos i
        WHERE NOT EXISTS (SELECT 1 FROM estado_riego_actual WHERE invernadero_id = i.id);
    """);
    
    # =========================================================
    # 11. AUDITORÍA DE ACCIONES (ejemplo)
    # =========================================================
    op.execute("""
        INSERT INTO auditoria_acciones (usuario_ci, accion, entidad_afectada, entidad_id, detalle_json, ip_origen, fecha_accion)
        SELECT 
            u.ci, 'LOGIN', 'users', NULL, '{"ip": "192.168.1.100"}'::jsonb, '192.168.1.100'::inet, now() - interval '5 days'
        FROM users u
        WHERE u.username IN ('admin_cea', 'tecnico_luis')
        AND NOT EXISTS (SELECT 1 FROM auditoria_acciones WHERE usuario_ci = u.ci AND accion = 'LOGIN');
    """);
    
    op.execute("""
        INSERT INTO auditoria_acciones (usuario_ci, accion, entidad_afectada, entidad_id, detalle_json, ip_origen, fecha_accion)
        SELECT 
            (SELECT ci FROM users WHERE username = 'tecnico_luis'),
            'ACTUALIZAR_UMBRAL', 'configuraciones_umbral', cu.id,
            jsonb_build_object('valor_anterior', 1.0, 'valor_nuevo', 1.2),
            '192.168.1.101'::inet, now() - interval '2 days'
        FROM configuraciones_umbral cu
        WHERE cu.parametro_umbral_id = (SELECT id FROM parametros_umbral WHERE nombre = 'caudal_minimo')
        AND NOT EXISTS (SELECT 1 FROM auditoria_acciones WHERE entidad_afectada = 'configuraciones_umbral' AND entidad_id = cu.id);
    """);
    
    # =========================================================
    # 12. CONFIGURACIONES DE UMBRAL POR INVERNADERO (sobreescribir valores globales)
    # =========================================================
    op.execute("""
        DO $$
        DECLARE
            config_global record;
            inv record;
            new_config_id integer;
        BEGIN
            FOR config_global IN 
                SELECT cu.id, cu.parametro_umbral_id, pu.nombre, cu.valor
                FROM configuraciones_umbral cu
                JOIN parametros_umbral pu ON cu.parametro_umbral_id = pu.id
                WHERE cu.ambito_umbral_id = (SELECT id FROM ambitos_umbral WHERE nombre = 'global')
            LOOP
                FOR inv IN SELECT id FROM invernaderos WHERE codigo IN ('INV-01', 'INV-02') LOOP
                    INSERT INTO configuraciones_umbral (parametro_umbral_id, valor, ambito_umbral_id, editable, actualizado_por_ci, actualizado_en)
                    SELECT config_global.parametro_umbral_id, config_global.valor + 10, 
                           (SELECT id FROM ambitos_umbral WHERE nombre = 'invernadero'),
                           true, NULL, now()
                    WHERE NOT EXISTS (
                        SELECT 1 FROM configuraciones_umbral cu2
                        WHERE cu2.parametro_umbral_id = config_global.parametro_umbral_id
                        AND cu2.ambito_umbral_id = (SELECT id FROM ambitos_umbral WHERE nombre = 'invernadero')
                    )
                    RETURNING id INTO new_config_id;
                    
                    IF new_config_id IS NOT NULL THEN
                        INSERT INTO configuraciones_umbral_invernaderos (configuracion_umbral_id, invernadero_id)
                        SELECT new_config_id, inv.id
                        WHERE NOT EXISTS (SELECT 1 FROM configuraciones_umbral_invernaderos WHERE configuracion_umbral_id = new_config_id AND invernadero_id = inv.id);
                    END IF;
                END LOOP;
            END LOOP;
        END $$;
    """);


def downgrade() -> None:
    pass