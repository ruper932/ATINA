"""Crear vistas de reportes

Revision ID: afeb90d5a7cb
Revises: 400d475bfb78
Create Date: 2026-05-06 14:32:39.445167

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'afeb90d5a7cb'
down_revision: Union[str, Sequence[str], None] = '400d475bfb78'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Reporte: Lecturas por Sensor (2 tablas: sensores + lecturassensor)
    op.execute("""
        CREATE VIEW vista_reporte_lecturas_sensor AS
        SELECT 
            ls.id as lectura_id,
            s.codigo as sensor_codigo,
            s.nombre as sensor_nombre,
            ls.valor as lectura_valor,
            ls.timestamp_lectura as fecha_lectura
        FROM lecturas_sensor ls
        JOIN sensores s ON ls.sensor_id = s.id;
    """)

    # 2. Reporte: Alertas por Invernadero (2 tablas: alertas + alertasinvernaderos)
    op.execute("""
        CREATE VIEW vista_reporte_alertas_invernadero AS
        SELECT 
            a.id as alerta_id,
            i.invernadero_id,
            a.tipo_alerta,
            a.mensaje,
            a.fecha_generacion
        FROM alertas a
        JOIN alertas_invernaderos i ON a.id = i.alerta_id;
    """)

    # 3. Reporte: Inventario de Dispositivos (2 tablas: dispositivos + tiposdispositivo)
    op.execute("""
        CREATE VIEW vista_reporte_inventario_dispositivos AS
        SELECT 
            d.id as dispositivo_id,
            d.codigo,
            d.nombre,
            t.nombre as tipo_dispositivo,
            d.estado_dispositivo_id
        FROM dispositivos d
        JOIN tipos_dispositivo t ON d.tipo_dispositivo_id = t.id;
    """)

    # 4. Reporte: Riego Ejecutado (3 tablas: decisionesriego + decisionesriegoinvernaderos + eventosriego)
    op.execute("""
        CREATE VIEW vista_reporte_riego_ejecutado AS
        SELECT 
            dr.id as decision_id,
            dri.invernadero_id,
            dr.texto_decision,
            er.inicio_evento,
            er.duracion_segundos
        FROM decisiones_riego dr
        JOIN decisiones_riego_invernaderos dri ON dr.id = dri.decision_riego_id
        JOIN eventos_riego er ON dr.id = er.decision_riego_id;
    """)

    # 5. Reporte: Predicciones de Agua (3 tablas: prediccionesml + modelosml + fuentesagua)
    op.execute("""
        CREATE VIEW vista_reporte_predicciones_agua AS
        SELECT 
            p.id as prediccion_id,
            fa.nombre as fuente_agua,
            m.nombre as modelo_usado,
            p.fecha_objetivo,
            p.volumen_predicho_l
        FROM predicciones_ml p
        JOIN modelos_ml m ON p.modelo_ml_id = m.id
        JOIN fuentes_agua fa ON p.fuente_agua_id = fa.id;
    """)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS vista_reporte_predicciones_agua;")
    op.execute("DROP VIEW IF EXISTS vista_reporte_riego_ejecutado;")
    op.execute("DROP VIEW IF EXISTS vista_reporte_inventario_dispositivos;")
    op.execute("DROP VIEW IF EXISTS vista_reporte_alertas_invernadero;")
    op.execute("DROP VIEW IF EXISTS vista_reporte_lecturas_sensor;")