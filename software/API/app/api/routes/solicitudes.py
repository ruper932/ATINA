from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_db
from app.crud.crud_solicitudes import crud_solicitudes
from app.models.solicitudes import EstadoSolicitud
from app.models.user import User
from app.schemas.solicitudes import (
    SolicitudCancelar,
    SolicitudMovimientoCreate,
    SolicitudMovimientoDetail,
    SolicitudMovimientoRead,
    SolicitudResolver,
    SolicitudTomarRevision,
)

router = APIRouter()


@router.post(
    "",
    response_model=SolicitudMovimientoRead,
    status_code=status.HTTP_201_CREATED,
)
async def crear_solicitud(
    payload: SolicitudMovimientoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud_solicitudes.create(db, current_user=current_user, obj_in=payload)

@router.get("", response_model=list[SolicitudMovimientoRead])
async def listar_solicitudes(
    estado: str | None = Query(None),
    solicitante_ci: str | None = Query(None),
    revisor_ci: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    estado_enum = None
    if estado:
        try:
            estado_enum = EstadoSolicitud(estado)
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Estado inválido: {estado}")
    
    if current_user.rol == "DOCENTE":
        solicitante_ci = current_user.ci  
        revisor_ci = None

    rows = await crud_solicitudes.list(
        db,
        estado=estado_enum,
        solicitante_ci=solicitante_ci,
        revisor_ci=revisor_ci,
        skip=skip,
        limit=limit,
        current_user=current_user,
    )

    return [
        {
            "id": row.id,
            "tipo_recurso": row.tipo_recurso,
            "recurso_id": row.recurso_id,
            "solicitante_ci": row.solicitante_ci,
            "revisor_ci": row.revisor_ci,
            "ubicacion_origen_id": row.ubicacion_origen_id,
            "ubicacion_destino_id": row.ubicacion_destino_id,
            "ubicacion_destino_propuesta": row.ubicacion_destino_propuesta,
            "motivo": row.motivo,
            "observacion": row.observacion,
            "pdf_url": row.pdf_url,
            "estado": row.estado,
            "fecha_creacion": row.fecha_creacion,
            "fecha_revision": row.fecha_revision,
            "fecha_resolucion": row.fecha_resolucion,
            "creado_en": row.creado_en,
            "actualizado_en": row.actualizado_en,
        }
        for row in rows
    ]

@router.get("/{solicitud_id}", response_model=SolicitudMovimientoDetail)
async def obtener_solicitud(
    solicitud_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = await crud_solicitudes.get(db, solicitud_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    return obj


@router.patch("/{solicitud_id}/tomar", response_model=SolicitudMovimientoDetail)
async def tomar_solicitud_en_revision(
    solicitud_id: int,
    payload: SolicitudTomarRevision,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud_solicitudes.tomar_revision(
        db,
        solicitud_id=solicitud_id,
        current_user=current_user,
        obj_in=payload,
    )


@router.patch("/{solicitud_id}/resolver", response_model=SolicitudMovimientoDetail)
async def resolver_solicitud(
    solicitud_id: int,
    payload: SolicitudResolver,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud_solicitudes.resolver(
        db,
        solicitud_id=solicitud_id,
        current_user=current_user,
        obj_in=payload,
    )


@router.patch("/{solicitud_id}/cancelar", response_model=SolicitudMovimientoDetail)
async def cancelar_solicitud(
    solicitud_id: int,
    payload: SolicitudCancelar,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud_solicitudes.cancelar(
        db,
        solicitud_id=solicitud_id,
        current_user=current_user,
        obj_in=payload,
    )