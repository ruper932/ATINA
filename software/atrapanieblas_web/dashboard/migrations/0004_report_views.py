from django.db import migrations

CREATE_VIEWS_SQL = """
CREATE OR REPLACE VIEW vw_reporte_invernaderos_ubicacion AS
SELECT
    i.id,
    i.codigo,
    i.nombre,
    i.area_m2,
    i.prioridad_riego,
    i.estado,
    u.nombre AS ubicacion_nombre,
    u.tipo_ubicacion,
    u.altitud_m
FROM invernaderos i
JOIN ubicaciones u ON i.ubicacion_id = u.id;


CREATE OR REPLACE VIEW vw_reporte_sensores_tipo AS
SELECT
    s.id,
    s.codigo,
    s.nombre,
    s.estado,
    s.modelo,
    s.numero_serie,
    ts.nombre AS tipo_sensor_nombre,
    ts.variable_medida,
    ts.unidad_base
FROM sensores s
JOIN tipos_sensor ts ON s.tipo_sensor_id = ts.id;


CREATE OR REPLACE VIEW vw_reporte_fuentes_ubicacion AS
SELECT
    f.id,
    f.codigo,
    f.nombre,
    f.tipo_fuente,
    f.capacidad_l,
    f.estado,
    u.nombre AS ubicacion_nombre,
    u.tipo_ubicacion
FROM fuentes_agua f
LEFT JOIN ubicaciones u ON f.ubicacion_id = u.id;


CREATE OR REPLACE VIEW vw_reporte_lecturas_sensor_tipo AS
SELECT
    ls.id,
    ls.timestamp_lectura,
    ls.timestamp_recepcion,
    ls.valor,
    ls.calidad_dato,
    s.codigo AS sensor_codigo,
    s.nombre AS sensor_nombre,
    ts.nombre AS tipo_sensor_nombre,
    ts.variable_medida,
    ts.unidad_base
FROM lecturas_sensor ls
JOIN sensores s ON ls.sensor_id = s.id
JOIN tipos_sensor ts ON s.tipo_sensor_id = ts.id;


CREATE OR REPLACE VIEW vw_reporte_decisiones_invernadero_fuente AS
SELECT
    dr.id,
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
    f.nombre AS fuente_nombre,
    f.tipo_fuente
FROM decisiones_riego dr
JOIN invernaderos i ON dr.invernadero_id = i.id
LEFT JOIN fuentes_agua f ON dr.fuente_agua_id = f.id;
"""

DROP_VIEWS_SQL = """
DROP VIEW IF EXISTS vw_reporte_decisiones_invernadero_fuente;
DROP VIEW IF EXISTS vw_reporte_lecturas_sensor_tipo;
DROP VIEW IF EXISTS vw_reporte_fuentes_ubicacion;
DROP VIEW IF EXISTS vw_reporte_sensores_tipo;
DROP VIEW IF EXISTS vw_reporte_invernaderos_ubicacion;
"""

class Migration(migrations.Migration):

    dependencies = [
        ("dashboard", "0003_db_objects"),
    ]

    operations = [
        migrations.RunSQL(
            sql=CREATE_VIEWS_SQL,
            reverse_sql=DROP_VIEWS_SQL,
        ),
    ]