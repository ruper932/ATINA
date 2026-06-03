from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_db
from app.crud.crud_tickets_mantenimiento import crud_tickets_mantenimiento
from app.models.tickets_mantenimiento import EstadoTicketMantenimiento, TipoRecursoTicket
from app.models.user import User
from app.schemas.tickets_mantenimiento import (
    TicketCancelar,
    TicketMantenimientoCreate,
    TicketMantenimientoRead,
    TicketResolver,
    TicketTomarRevision,
)

router = APIRouter()


@router.post("", response_model=TicketMantenimientoRead, status_code=status.HTTP_201_CREATED)
async def crear_ticket(
    payload: TicketMantenimientoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud_tickets_mantenimiento.create(db, current_user=current_user, obj_in=payload)


@router.get("", response_model=list[TicketMantenimientoRead])
async def listar_tickets(
    estado: EstadoTicketMantenimiento | None = Query(None),
    tipo_recurso: TipoRecursoTicket | None = Query(None),
    reportante_ci: str | None = Query(None, min_length=4, max_length=20, pattern=r"^[0-9]+[A-Za-z0-9-]*$"),
    tecnico_ci: str | None = Query(None, min_length=4, max_length=20, pattern=r"^[0-9]+[A-Za-z0-9-]*$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = await crud_tickets_mantenimiento.list(
        db,
        estado=estado,
        tipo_recurso=tipo_recurso,
        reportante_ci=reportante_ci.strip() if reportante_ci else None,
        tecnico_ci=tecnico_ci.strip() if tecnico_ci else None,
        skip=skip,
        limit=limit,
        current_user=current_user,
    )
    return rows


@router.get("/{ticket_id}", response_model=TicketMantenimientoRead)
async def obtener_ticket(
    ticket_id: int = Path(..., ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud_tickets_mantenimiento.get(db, ticket_id, current_user=current_user)


@router.patch("/{ticket_id}/tomar", response_model=TicketMantenimientoRead)
async def tomar_ticket(
    ticket_id: int = Path(..., ge=1),
    payload: TicketTomarRevision = ...,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud_tickets_mantenimiento.tomar_revision(
        db, ticket_id=ticket_id, current_user=current_user, obj_in=payload
    )


@router.patch("/{ticket_id}/resolver", response_model=TicketMantenimientoRead)
async def resolver_ticket(
    ticket_id: int = Path(..., ge=1),
    payload: TicketResolver = ...,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud_tickets_mantenimiento.resolver(
        db, ticket_id=ticket_id, current_user=current_user, obj_in=payload
    )


@router.patch("/{ticket_id}/cancelar", response_model=TicketMantenimientoRead)
async def cancelar_ticket(
    ticket_id: int = Path(..., ge=1),
    payload: TicketCancelar = ...,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud_tickets_mantenimiento.cancelar(
        db, ticket_id=ticket_id, current_user=current_user, obj_in=payload
    )