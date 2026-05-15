from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import BigInteger

import sqlalchemy as sa
from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class EstadoSincronizacion(Base):
    __tablename__ = "estados_sincronizacion"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)


class SincronizacionMCP(Base):
    __tablename__ = "sincronizaciones_mcp"
    __table_args__ = (
        CheckConstraint("cantidad_registros >= 0", name="chk_sincronizaciones_mcp_registros"),
        CheckConstraint(
            "fecha_fin IS NULL OR fecha_fin >= fecha_inicio",
            name="chk_sincronizaciones_mcp_fechas",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    estado_sincronizacion_id: Mapped[int] = mapped_column(
        ForeignKey("estados_sincronizacion.id", ondelete="RESTRICT"),
        nullable=False,
    )
    dispositivo_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("dispositivos.id", ondelete="SET NULL"),
        nullable=True
    )
    origen: Mapped[str] = mapped_column(String(50), nullable=False)
    destino: Mapped[str] = mapped_column(String(50), nullable=False)
    tipo_recurso: Mapped[str] = mapped_column(String(50), nullable=False)
    cantidad_registros: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=sa.text("0"),
    )
    fecha_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    fecha_fin: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    mensaje_resultado: Mapped[str | None] = mapped_column(Text, nullable=True)


class ReporteSemanal(Base):
    __tablename__ = "reportes_semanales"
    __table_args__ = (
        CheckConstraint("periodo_fin >= periodo_inicio", name="chk_reportes_semanales_periodo"),
        CheckConstraint(
            "volumen_captado_l >= 0 AND volumen_predicho_l >= 0 AND total_alertas >= 0",
            name="chk_reportes_semanales_valores",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    periodo_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    periodo_fin: Mapped[date] = mapped_column(Date, nullable=False)
    volumen_captado_l: Mapped[Decimal] = mapped_column(
        Numeric(14, 4),
        nullable=False,
        default=Decimal("0"),
        server_default=sa.text("0"),
    )
    volumen_predicho_l: Mapped[Decimal] = mapped_column(
        Numeric(14, 4),
        nullable=False,
        default=Decimal("0"),
        server_default=sa.text("0"),
    )
    eficiencia_riego: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    total_alertas: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=sa.text("0"),
    )
    resumen: Mapped[str | None] = mapped_column(Text, nullable=True)
    generado_por_ci: Mapped[str | None] = mapped_column(
        String(20),
        ForeignKey("users.ci", ondelete="SET NULL"),
        nullable=True,
    )
    fecha_generacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class VistaReporteLecturasSensor(Base):
    __tablename__ = "vista_reporte_lecturas_sensor"
    __mapper_args__ = {"primary_key": ["lectura_id"]}

    lectura_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sensor_codigo: Mapped[str] = mapped_column(String(50))
    sensor_nombre: Mapped[str] = mapped_column(String(100))
    lectura_valor: Mapped[Decimal] = mapped_column(Numeric(14, 4))
    fecha_lectura: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class VistaReporteAlertasInvernadero(Base):
    __tablename__ = "vista_reporte_alertas_invernadero"
    __mapper_args__ = {"primary_key": ["alerta_id"]}

    alerta_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    invernadero_id: Mapped[int] = mapped_column(Integer)
    tipo_alerta: Mapped[str] = mapped_column(String(50))
    mensaje: Mapped[str] = mapped_column(Text)
    fecha_generacion: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class VistaReporteInventarioDispositivos(Base):
    __tablename__ = "vista_reporte_inventario_dispositivos"
    __mapper_args__ = {"primary_key": ["dispositivo_id"]}

    dispositivo_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50))
    nombre: Mapped[str] = mapped_column(String(100))
    tipo_dispositivo: Mapped[str] = mapped_column(String(50))
    estado_dispositivo_id: Mapped[int] = mapped_column(Integer)


class VistaReporteRiegoEjecutado(Base):
    __tablename__ = "vista_reporte_riego_ejecutado"
    __mapper_args__ = {"primary_key": ["decision_id"]}

    decision_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    invernadero_id: Mapped[int] = mapped_column(Integer)
    texto_decision: Mapped[str] = mapped_column(Text)
    inicio_evento: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    duracion_segundos: Mapped[int | None] = mapped_column(Integer, nullable=True)


class VistaReportePrediccionesAgua(Base):
    __tablename__ = "vista_reporte_predicciones_agua"
    __mapper_args__ = {"primary_key": ["prediccion_id"]}

    prediccion_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fuente_agua: Mapped[str] = mapped_column(String(100))
    modelo_usado: Mapped[str] = mapped_column(String(100))
    fecha_objetivo: Mapped[date] = mapped_column(Date)
    volumen_predicho_l: Mapped[Decimal] = mapped_column(Numeric(14, 4))