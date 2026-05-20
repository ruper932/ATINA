# app/api/routes/reportes.py
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_db
from app.crud import crud_reportes as crud
from app.models.user import User
from app.models.reportes import (
    ReporteSemanal,
    SincronizacionMCP,
    VistaReporteAlertasInvernadero,
    VistaReporteInventarioDispositivos,
    VistaReporteLecturasSensor,
    VistaReportePrediccionesAgua,
    VistaReporteRiegoEjecutado,
)
from app.models.infraestructura import Invernadero
from app.models.dispositivos import Dispositivo

from app.schemas.reportes import (
    ReporteSemanalCreate,
    ReporteSemanalResponse,
    SincronizacionMCPCreate,
    SincronizacionMCPResponse,
    SincronizacionMCPUpdate,
    VReporteAlertasInvernaderoResponse,
    VReporteInventarioDispositivosResponse,
    VReporteLecturasSensorResponse,
    VReportePrediccionesAguaResponse,
    VReporteRiegoEjecutadoResponse,
)

router = APIRouter()


def apply_filters(stmt, filters: list):
    if filters:
        stmt = stmt.where(*filters)
    return stmt


def apply_pagination(stmt, skip: int, limit: int, export_all: bool = False):
    if export_all:
        return stmt
    return stmt.offset(skip).limit(limit)


async def build_invernaderos_map(db: AsyncSession, ids: set[int]) -> dict[int, str]:
    if not ids:
        return {}

    result = await db.execute(
        select(Invernadero.id, Invernadero.nombre).where(Invernadero.id.in_(ids))
    )
    return {row.id: row.nombre for row in result.all()}


async def build_estados_dispositivo_map(db: AsyncSession, ids: set[int]) -> dict[int, str]:
    if not ids:
        return {}

    result = await db.execute(
        text("""
            SELECT id, nombre
            FROM estados_dispositivo
            WHERE id = ANY(:ids)
        """),
        {"ids": list(ids)},
    )
    return {row.id: row.nombre for row in result.mappings()}


async def build_estados_sincronizacion_map(db: AsyncSession, ids: set[int]) -> dict[int, str]:
    if not ids:
        return {}

    result = await db.execute(
        text("""
            SELECT id, nombre
            FROM estados_sincronizacion
            WHERE id = ANY(:ids)
        """),
        {"ids": list(ids)},
    )
    return {row.id: row.nombre for row in result.mappings()}


async def build_dispositivos_map(db: AsyncSession, ids: set[int]) -> dict[int, dict]:
    if not ids:
        return {}

    result = await db.execute(
        select(Dispositivo.id, Dispositivo.codigo, Dispositivo.nombre).where(
            Dispositivo.id.in_(ids)
        )
    )
    return {
        row.id: {
            "codigo": row.codigo,
            "nombre": row.nombre,
        }
        for row in result.all()
    }


@router.post(
    "/sincronizaciones",
    response_model=SincronizacionMCPResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_sincronizacion(
    obj_in: SincronizacionMCPCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    created = await crud.sincronizacion_mcp.create(db=db, obj_in=obj_in)

    estado_map = await build_estados_sincronizacion_map(
        db, {created.estado_sincronizacion_id}
    )
    dispositivo_map = await build_dispositivos_map(
        db, {created.dispositivo_id} if created.dispositivo_id else set()
    )

    dispositivo_info = (
        dispositivo_map.get(created.dispositivo_id, {})
        if created.dispositivo_id
        else {}
    )

    return {
        "id": created.id,
        "estado_sincronizacion_id": created.estado_sincronizacion_id,
        "estado_sincronizacion_nombre": estado_map.get(created.estado_sincronizacion_id),
        "dispositivo_id": created.dispositivo_id,
        "dispositivo_codigo": dispositivo_info.get("codigo"),
        "dispositivo_nombre": dispositivo_info.get("nombre"),
        "origen": created.origen,
        "destino": created.destino,
        "tipo_recurso": created.tipo_recurso,
        "cantidad_registros": created.cantidad_registros,
        "fecha_inicio": created.fecha_inicio,
        "fecha_fin": created.fecha_fin,
        "mensaje_resultado": created.mensaje_resultado,
    }


@router.put("/sincronizaciones/{id}", response_model=SincronizacionMCPResponse)
async def update_sincronizacion(
    id: int,
    obj_in: SincronizacionMCPUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = await crud.sincronizacion_mcp.get(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sincronización no encontrada")

    updated = await crud.sincronizacion_mcp.update(db=db, db_obj=obj, obj_in=obj_in)

    estado_map = await build_estados_sincronizacion_map(
        db, {updated.estado_sincronizacion_id}
    )
    dispositivo_map = await build_dispositivos_map(
        db, {updated.dispositivo_id} if updated.dispositivo_id else set()
    )

    dispositivo_info = (
        dispositivo_map.get(updated.dispositivo_id, {})
        if updated.dispositivo_id
        else {}
    )

    return {
        "id": updated.id,
        "estado_sincronizacion_id": updated.estado_sincronizacion_id,
        "estado_sincronizacion_nombre": estado_map.get(updated.estado_sincronizacion_id),
        "dispositivo_id": updated.dispositivo_id,
        "dispositivo_codigo": dispositivo_info.get("codigo"),
        "dispositivo_nombre": dispositivo_info.get("nombre"),
        "origen": updated.origen,
        "destino": updated.destino,
        "tipo_recurso": updated.tipo_recurso,
        "cantidad_registros": updated.cantidad_registros,
        "fecha_inicio": updated.fecha_inicio,
        "fecha_fin": updated.fecha_fin,
        "mensaje_resultado": updated.mensaje_resultado,
    }


@router.get("/sincronizaciones", response_model=list[SincronizacionMCPResponse])
async def read_sincronizaciones(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    export_all: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = await crud.sincronizacion_mcp.get_multi(
        db=db,
        skip=0 if export_all else skip,
        limit=1000000 if export_all else limit,
    )

    estado_ids = {row.estado_sincronizacion_id for row in rows}
    dispositivo_ids = {
        row.dispositivo_id for row in rows if row.dispositivo_id is not None
    }

    estado_map = await build_estados_sincronizacion_map(db, estado_ids)
    dispositivo_map = await build_dispositivos_map(db, dispositivo_ids)

    return [
        {
            "id": row.id,
            "estado_sincronizacion_id": row.estado_sincronizacion_id,
            "estado_sincronizacion_nombre": estado_map.get(row.estado_sincronizacion_id),
            "dispositivo_id": row.dispositivo_id,
            "dispositivo_codigo": (
                dispositivo_map.get(row.dispositivo_id, {}).get("codigo")
                if row.dispositivo_id is not None
                else None
            ),
            "dispositivo_nombre": (
                dispositivo_map.get(row.dispositivo_id, {}).get("nombre")
                if row.dispositivo_id is not None
                else None
            ),
            "origen": row.origen,
            "destino": row.destino,
            "tipo_recurso": row.tipo_recurso,
            "cantidad_registros": row.cantidad_registros,
            "fecha_inicio": row.fecha_inicio,
            "fecha_fin": row.fecha_fin,
            "mensaje_resultado": row.mensaje_resultado,
        }
        for row in rows
    ]


@router.post(
    "",
    response_model=ReporteSemanalResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_reporte(
    obj_in: ReporteSemanalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj_in_data = obj_in.model_dump()
    obj_in_data["generado_por_ci"] = current_user.ci

    db_obj = ReporteSemanal(**obj_in_data)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


@router.get("", response_model=list[ReporteSemanalResponse])
async def read_reportes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    export_all: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.reporte_semanal.get_multi(
        db=db,
        skip=0 if export_all else skip,
        limit=1000000 if export_all else limit,
    )


@router.get(
    "/vistas/lecturas-sensor",
    response_model=list[VReporteLecturasSensorResponse],
)
async def get_reporte_lecturas_sensor(
    q: str | None = Query(None, min_length=1, max_length=100),
    sensor_codigo: str | None = Query(None, min_length=1, max_length=50),
    sensor_nombre: str | None = Query(None, min_length=1, max_length=100),
    fecha_desde: datetime | None = Query(None),
    fecha_hasta: datetime | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    export_all: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(VistaReporteLecturasSensor)
    filters = []

    if q:
        term = f"%{q.strip()}%"
        filters.append(
            or_(
                VistaReporteLecturasSensor.sensor_codigo.ilike(term),
                VistaReporteLecturasSensor.sensor_nombre.ilike(term),
            )
        )

    if sensor_codigo:
        filters.append(
            VistaReporteLecturasSensor.sensor_codigo.ilike(
                f"%{sensor_codigo.strip()}%"
            )
        )

    if sensor_nombre:
        filters.append(
            VistaReporteLecturasSensor.sensor_nombre.ilike(
                f"%{sensor_nombre.strip()}%"
            )
        )

    if fecha_desde:
        filters.append(VistaReporteLecturasSensor.fecha_lectura >= fecha_desde)

    if fecha_hasta:
        filters.append(VistaReporteLecturasSensor.fecha_lectura <= fecha_hasta)

    stmt = apply_filters(stmt, filters)
    stmt = apply_pagination(stmt, skip, limit, export_all)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get(
    "/vistas/alertas-invernadero",
    response_model=list[VReporteAlertasInvernaderoResponse],
)
async def get_reporte_alertas_invernadero(
    q: str | None = Query(None, min_length=1, max_length=100),
    tipo_alerta: str | None = Query(None, min_length=1, max_length=50),
    mensaje: str | None = Query(None, min_length=1, max_length=250),
    invernadero_id: int | None = Query(None, ge=1),
    fecha_desde: datetime | None = Query(None),
    fecha_hasta: datetime | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    export_all: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(VistaReporteAlertasInvernadero)
    filters = []

    if q:
        term = f"%{q.strip()}%"
        filters.append(
            or_(
                VistaReporteAlertasInvernadero.tipo_alerta.ilike(term),
                VistaReporteAlertasInvernadero.mensaje.ilike(term),
            )
        )

    if tipo_alerta:
        filters.append(
            VistaReporteAlertasInvernadero.tipo_alerta.ilike(
                f"%{tipo_alerta.strip()}%"
            )
        )

    if mensaje:
        filters.append(
            VistaReporteAlertasInvernadero.mensaje.ilike(f"%{mensaje.strip()}%")
        )

    if invernadero_id is not None:
        filters.append(
            VistaReporteAlertasInvernadero.invernadero_id == invernadero_id
        )

    if fecha_desde:
        filters.append(
            VistaReporteAlertasInvernadero.fecha_generacion >= fecha_desde
        )

    if fecha_hasta:
        filters.append(
            VistaReporteAlertasInvernadero.fecha_generacion <= fecha_hasta
        )

    stmt = apply_filters(stmt, filters)
    stmt = apply_pagination(stmt, skip, limit, export_all)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    invernadero_ids = {row.invernadero_id for row in rows}
    invernaderos_map = await build_invernaderos_map(db, invernadero_ids)

    return [
        {
            "alerta_id": row.alerta_id,
            "invernadero_id": row.invernadero_id,
            "invernadero_nombre": invernaderos_map.get(row.invernadero_id),
            "tipo_alerta": row.tipo_alerta,
            "mensaje": row.mensaje,
            "fecha_generacion": row.fecha_generacion,
        }
        for row in rows
    ]


@router.get(
    "/vistas/inventario-dispositivos",
    response_model=list[VReporteInventarioDispositivosResponse],
)
async def get_reporte_inventario_dispositivos(
    q: str | None = Query(None, min_length=1, max_length=100),
    codigo: str | None = Query(None, min_length=1, max_length=50),
    nombre: str | None = Query(None, min_length=1, max_length=100),
    tipo_dispositivo: str | None = Query(None, min_length=1, max_length=50),
    estado_dispositivo_id: int | None = Query(None, ge=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    export_all: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(VistaReporteInventarioDispositivos)
    filters = []

    if q:
        term = f"%{q.strip()}%"
        filters.append(
            or_(
                VistaReporteInventarioDispositivos.codigo.ilike(term),
                VistaReporteInventarioDispositivos.nombre.ilike(term),
                VistaReporteInventarioDispositivos.tipo_dispositivo.ilike(term),
            )
        )

    if codigo:
        filters.append(
            VistaReporteInventarioDispositivos.codigo.ilike(f"%{codigo.strip()}%")
        )

    if nombre:
        filters.append(
            VistaReporteInventarioDispositivos.nombre.ilike(f"%{nombre.strip()}%")
        )

    if tipo_dispositivo:
        filters.append(
            VistaReporteInventarioDispositivos.tipo_dispositivo.ilike(
                f"%{tipo_dispositivo.strip()}%"
            )
        )

    if estado_dispositivo_id is not None:
        filters.append(
            VistaReporteInventarioDispositivos.estado_dispositivo_id
            == estado_dispositivo_id
        )

    stmt = apply_filters(stmt, filters)
    stmt = apply_pagination(stmt, skip, limit, export_all)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    estado_ids = {row.estado_dispositivo_id for row in rows}
    estados_map = await build_estados_dispositivo_map(db, estado_ids)

    return [
        {
            "dispositivo_id": row.dispositivo_id,
            "codigo": row.codigo,
            "nombre": row.nombre,
            "tipo_dispositivo": row.tipo_dispositivo,
            "estado_dispositivo_id": row.estado_dispositivo_id,
            "estado_dispositivo_nombre": estados_map.get(row.estado_dispositivo_id),
        }
        for row in rows
    ]


@router.get(
    "/vistas/riego-ejecutado",
    response_model=list[VReporteRiegoEjecutadoResponse],
)
async def get_reporte_riego_ejecutado(
    q: str | None = Query(None, min_length=1, max_length=100),
    invernadero_id: int | None = Query(None, ge=1),
    texto_decision: str | None = Query(None, min_length=1, max_length=250),
    fecha_desde: datetime | None = Query(None),
    fecha_hasta: datetime | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    export_all: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(VistaReporteRiegoEjecutado)
    filters = []

    if q:
        term = f"%{q.strip()}%"
        filters.append(VistaReporteRiegoEjecutado.texto_decision.ilike(term))

    if invernadero_id is not None:
        filters.append(VistaReporteRiegoEjecutado.invernadero_id == invernadero_id)

    if texto_decision:
        filters.append(
            VistaReporteRiegoEjecutado.texto_decision.ilike(
                f"%{texto_decision.strip()}%"
            )
        )

    if fecha_desde:
        filters.append(VistaReporteRiegoEjecutado.inicio_evento >= fecha_desde)

    if fecha_hasta:
        filters.append(VistaReporteRiegoEjecutado.inicio_evento <= fecha_hasta)

    stmt = apply_filters(stmt, filters)
    stmt = apply_pagination(stmt, skip, limit, export_all)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    invernadero_ids = {row.invernadero_id for row in rows}
    invernaderos_map = await build_invernaderos_map(db, invernadero_ids)

    return [
        {
            "decision_id": row.decision_id,
            "invernadero_id": row.invernadero_id,
            "invernadero_nombre": invernaderos_map.get(row.invernadero_id),
            "texto_decision": row.texto_decision,
            "inicio_evento": row.inicio_evento,
            "duracion_segundos": row.duracion_segundos,
        }
        for row in rows
    ]


@router.get(
    "/vistas/predicciones-agua",
    response_model=list[VReportePrediccionesAguaResponse],
)
async def get_reporte_predicciones_agua(
    q: str | None = Query(None, min_length=1, max_length=100),
    fuente_agua: str | None = Query(None, min_length=1, max_length=100),
    modelo_usado: str | None = Query(None, min_length=1, max_length=100),
    fecha_desde: date | None = Query(None),
    fecha_hasta: date | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    export_all: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(VistaReportePrediccionesAgua)
    filters = []

    if q:
        term = f"%{q.strip()}%"
        filters.append(
            or_(
                VistaReportePrediccionesAgua.fuente_agua.ilike(term),
                VistaReportePrediccionesAgua.modelo_usado.ilike(term),
            )
        )

    if fuente_agua:
        filters.append(
            VistaReportePrediccionesAgua.fuente_agua.ilike(
                f"%{fuente_agua.strip()}%"
            )
        )

    if modelo_usado:
        filters.append(
            VistaReportePrediccionesAgua.modelo_usado.ilike(
                f"%{modelo_usado.strip()}%"
            )
        )

    if fecha_desde:
        filters.append(VistaReportePrediccionesAgua.fecha_objetivo >= fecha_desde)

    if fecha_hasta:
        filters.append(VistaReportePrediccionesAgua.fecha_objetivo <= fecha_hasta)

    stmt = apply_filters(stmt, filters)
    stmt = apply_pagination(stmt, skip, limit, export_all)
    result = await db.execute(stmt)
    return result.scalars().all()