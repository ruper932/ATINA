from django.db import migrations

CREATE_OBJECTS_SQL = """
CREATE OR REPLACE FUNCTION fn_actualizar_estado_riego_actual()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO estado_riego_actual (invernadero_id, ultima_decision_id, actualizado_en)
    VALUES (NEW.invernadero_id, NEW.id, NOW())
    ON CONFLICT (invernadero_id)
    DO UPDATE SET
        ultima_decision_id = EXCLUDED.ultima_decision_id,
        actualizado_en = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_decision_riego_estado_actual ON decisiones_riego;
CREATE TRIGGER trg_decision_riego_estado_actual
AFTER INSERT ON decisiones_riego
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_estado_riego_actual();


CREATE OR REPLACE FUNCTION fn_set_actualizado_en_umbral()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_config_umbral_updated_at ON configuraciones_umbral;
CREATE TRIGGER trg_config_umbral_updated_at
BEFORE UPDATE ON configuraciones_umbral
FOR EACH ROW
EXECUTE FUNCTION fn_set_actualizado_en_umbral();


CREATE OR REPLACE VIEW vw_lecturas_detalladas AS
SELECT
    ls.id AS lectura_id,
    ls.timestamp_lectura,
    ls.timestamp_recepcion,
    ls.valor,
    ls.calidad_dato,
    s.id AS sensor_id,
    s.codigo AS sensor_codigo,
    s.nombre AS sensor_nombre,
    ts.nombre AS tipo_sensor,
    ts.variable_medida,
    ts.unidad_base,
    d.id AS dispositivo_id,
    d.codigo AS dispositivo_codigo,
    d.nombre AS dispositivo_nombre
FROM lecturas_sensor ls
JOIN sensores s ON ls.sensor_id = s.id
JOIN tipos_sensor ts ON s.tipo_sensor_id = ts.id
JOIN dispositivos d ON s.dispositivo_id = d.id;


CREATE OR REPLACE VIEW vw_decisiones_riego_detalladas AS
SELECT
    dr.id AS decision_id,
    dr.ejecutado_en,
    dr.origen_decision,
    dr.modo_riego,
    dr.estado_valvula,
    dr.volumen_disponible_l,
    dr.demanda_estimada_l,
    dr.volumen_aplicado_l,
    i.codigo AS invernadero_codigo,
    i.nombre AS invernadero_nombre,
    f.codigo AS fuente_codigo,
    f.nombre AS fuente_nombre
FROM decisiones_riego dr
JOIN invernaderos i ON dr.invernadero_id = i.id
LEFT JOIN fuentes_agua f ON dr.fuente_agua_id = f.id;


CREATE OR REPLACE VIEW vw_alertas_operativas AS
SELECT
    a.id AS alerta_id,
    a.tipo_alerta,
    a.severidad,
    a.origen_alerta,
    a.estado_alerta,
    a.fecha_generacion,
    i.codigo AS invernadero_codigo,
    d.codigo AS dispositivo_codigo,
    s.codigo AS sensor_codigo
FROM alertas a
LEFT JOIN invernaderos i ON a.invernadero_id = i.id
LEFT JOIN dispositivos d ON a.dispositivo_id = d.id
LEFT JOIN sensores s ON a.sensor_id = s.id;
"""

DROP_OBJECTS_SQL = """
DROP VIEW IF EXISTS vw_alertas_operativas;
DROP VIEW IF EXISTS vw_decisiones_riego_detalladas;
DROP VIEW IF EXISTS vw_lecturas_detalladas;

DROP TRIGGER IF EXISTS trg_config_umbral_updated_at ON configuraciones_umbral;
DROP FUNCTION IF EXISTS fn_set_actualizado_en_umbral();

DROP TRIGGER IF EXISTS trg_decision_riego_estado_actual ON decisiones_riego;
DROP FUNCTION IF EXISTS fn_actualizar_estado_riego_actual();
"""

class Migration(migrations.Migration):

    dependencies = [
        ("dashboard", "0002_seed_data"),
    ]

    operations = [
        migrations.RunSQL(
            sql=CREATE_OBJECTS_SQL,
            reverse_sql=DROP_OBJECTS_SQL,
        ),
    ]