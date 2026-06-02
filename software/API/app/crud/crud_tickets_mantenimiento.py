from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.catalogos import EstadoActuador, EstadoDispositivo, EstadoSensor
from app.models.dispositivos import Actuador, Dispositivo, Sensor
from app.models.tickets_mantenimiento import (
    EstadoTicketMantenimiento,
    HistorialTicketMantenimiento,
    ResultadoRevisionTicket,
    TipoRecursoTicket,
    TicketMantenimiento,
)
from app.models.user import User
from app.schemas.tickets_mantenimiento import (
    TicketCancelar,
    TicketMantenimientoCreate,
    TicketResolver,
    TicketTomarRevision,
)


class CRUDTicketsMantenimiento:
    @staticmethod
    def _now() -> datetime:
        return datetime.now(timezone.utc)

    @staticmethod
    def _role_name(user: User) -> str | None:
        rol = getattr(user, "rol", None)
        if rol and getattr(rol, "nombre", None):
            return rol.nombre.lower()
        if rol and isinstance(rol, str):
            return rol.lower()
        return None

    @staticmethod
    def _require_roles(user: User, allowed: set[str]) -> None:
        if CRUDTicketsMantenimiento._role_name(user) not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción",
            )

    @staticmethod
    async def _get_recurso(db: AsyncSession, tipo_recurso: TipoRecursoTicket, recurso_id: int):
        if tipo_recurso == TipoRecursoTicket.dispositivo:
            obj = await db.get(Dispositivo, recurso_id)
        elif tipo_recurso == TipoRecursoTicket.sensor:
            obj = await db.get(Sensor, recurso_id)
        elif tipo_recurso == TipoRecursoTicket.actuador:
            obj = await db.get(Actuador, recurso_id)
        else:
            obj = None

        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recurso no encontrado",
            )
        return obj

    @staticmethod
    def _add_historial(
        db: AsyncSession,
        ticket_id: int,
        estado_anterior: EstadoTicketMantenimiento | None,
        estado_nuevo: EstadoTicketMantenimiento,
        actor_ci: str | None,
        comentario: str | None = None,
    ) -> HistorialTicketMantenimiento:
        historial = HistorialTicketMantenimiento(
            ticket_id=ticket_id,
            estado_anterior=estado_anterior,
            estado_nuevo=estado_nuevo,
            actor_ci=actor_ci,
            comentario=comentario,
        )
        db.add(historial)
        return historial

    @staticmethod
    async def _get_estado_catalogo_id(
        db: AsyncSession,
        *,
        tipo_recurso: TipoRecursoTicket,
        resultado_revision: ResultadoRevisionTicket,
    ) -> tuple[str, int] | None:
        if tipo_recurso == TipoRecursoTicket.dispositivo:
            if resultado_revision == ResultadoRevisionTicket.danado:
                stmt = select(EstadoDispositivo).where(EstadoDispositivo.nombre.ilike("falla"))
                result = await db.execute(stmt)
                estado = result.scalar_one_or_none()
                if estado:
                    return ("estado_dispositivo_id", estado.id)

            if resultado_revision == ResultadoRevisionTicket.mantenimiento:
                stmt = select(EstadoDispositivo).where(EstadoDispositivo.nombre.ilike("falla"))
                result = await db.execute(stmt)
                estado = result.scalar_one_or_none()
                if estado:
                    return ("estado_dispositivo_id", estado.id)

        elif tipo_recurso == TipoRecursoTicket.sensor:
            if resultado_revision == ResultadoRevisionTicket.danado:
                stmt = select(EstadoSensor).where(EstadoSensor.nombre.ilike("inactivo"))
                result = await db.execute(stmt)
                estado = result.scalar_one_or_none()
                if estado:
                    return ("estado_sensor_id", estado.id)

            if resultado_revision == ResultadoRevisionTicket.mantenimiento:
                stmt = select(EstadoSensor).where(EstadoSensor.nombre.ilike("mantenimiento"))
                result = await db.execute(stmt)
                estado = result.scalar_one_or_none()
                if estado:
                    return ("estado_sensor_id", estado.id)

        elif tipo_recurso == TipoRecursoTicket.actuador:
            if resultado_revision == ResultadoRevisionTicket.danado:
                stmt = select(EstadoActuador).where(EstadoActuador.nombre.ilike("falla"))
                result = await db.execute(stmt)
                estado = result.scalar_one_or_none()
                if estado:
                    return ("estado_actuador_id", estado.id)

            if resultado_revision == ResultadoRevisionTicket.mantenimiento:
                stmt = select(EstadoActuador).where(EstadoActuador.nombre.ilike("falla"))
                result = await db.execute(stmt)
                estado = result.scalar_one_or_none()
                if estado:
                    return ("estado_actuador_id", estado.id)

        return None

    @staticmethod
    async def create(
        db: AsyncSession, *, current_user: User, obj_in: TicketMantenimientoCreate
    ) -> TicketMantenimiento:
        CRUDTicketsMantenimiento._require_roles(current_user, {"docente"})

        await CRUDTicketsMantenimiento._get_recurso(db, obj_in.tipo_recurso, obj_in.recurso_id)

        ticket = TicketMantenimiento(
            tipo_recurso=obj_in.tipo_recurso,
            recurso_id=obj_in.recurso_id,
            reportante_ci=current_user.ci,
            descripcion_problema=obj_in.descripcion_problema.strip(),
            estado=EstadoTicketMantenimiento.pendiente,
        )

        db.add(ticket)
        await db.flush()

        CRUDTicketsMantenimiento._add_historial(
            db,
            ticket_id=ticket.id,
            estado_anterior=None,
            estado_nuevo=EstadoTicketMantenimiento.pendiente,
            actor_ci=current_user.ci,
            comentario="Ticket creado",
        )

        await db.commit()
        await db.refresh(ticket)
        return await CRUDTicketsMantenimiento.get(db, ticket.id, current_user=current_user)

    @staticmethod
    async def get(
        db: AsyncSession, ticket_id: int, current_user: User | None = None
    ) -> TicketMantenimiento:
        stmt = (
            select(TicketMantenimiento)
            .options(selectinload(TicketMantenimiento.historial))
            .where(TicketMantenimiento.id == ticket_id)
        )
        result = await db.execute(stmt)
        ticket = result.scalar_one_or_none()

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket no encontrado",
            )

        if (
            current_user
            and CRUDTicketsMantenimiento._role_name(current_user) == "docente"
            and ticket.reportante_ci != current_user.ci
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver este ticket",
            )

        return ticket

    @staticmethod
    async def list(
        db: AsyncSession,
        *,
        estado: EstadoTicketMantenimiento | None = None,
        tipo_recurso: TipoRecursoTicket | None = None,
        reportante_ci: str | None = None,
        tecnico_ci: str | None = None,
        skip: int = 0,
        limit: int = 100,
        current_user: User | None = None,
    ) -> list[TicketMantenimiento]:
        stmt = (
            select(TicketMantenimiento)
            .options(selectinload(TicketMantenimiento.historial))
            .order_by(TicketMantenimiento.id.desc())
        )
        role = CRUDTicketsMantenimiento._role_name(current_user) if current_user else None

        if role == "docente":
            stmt = stmt.where(TicketMantenimiento.reportante_ci == current_user.ci)
        else:
            if estado:
                stmt = stmt.where(TicketMantenimiento.estado == estado)
            if tipo_recurso:
                stmt = stmt.where(TicketMantenimiento.tipo_recurso == tipo_recurso)
            if reportante_ci:
                stmt = stmt.where(TicketMantenimiento.reportante_ci == reportante_ci)
            if tecnico_ci:
                stmt = stmt.where(TicketMantenimiento.tecnico_ci == tecnico_ci)

        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def tomar_revision(
        db: AsyncSession, *, ticket_id: int, current_user: User, obj_in: TicketTomarRevision
    ) -> TicketMantenimiento:
        CRUDTicketsMantenimiento._require_roles(current_user, {"admin", "tecnico"})

        ticket = await CRUDTicketsMantenimiento.get(db, ticket_id, current_user=current_user)
        if ticket.estado != EstadoTicketMantenimiento.pendiente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se puede tomar un ticket pendiente",
            )

        estado_anterior = ticket.estado
        ticket.estado = EstadoTicketMantenimiento.en_revision
        ticket.tecnico_ci = current_user.ci
        ticket.fecha_toma = CRUDTicketsMantenimiento._now()
        ticket.actualizado_en = CRUDTicketsMantenimiento._now()

        CRUDTicketsMantenimiento._add_historial(
            db,
            ticket.id,
            estado_anterior,
            EstadoTicketMantenimiento.en_revision,
            current_user.ci,
            obj_in.comentario or "Ticket tomado en revisión",
        )

        await db.commit()
        await db.refresh(ticket)
        return await CRUDTicketsMantenimiento.get(db, ticket.id, current_user=current_user)

    @staticmethod
    async def resolver(
        db: AsyncSession, *, ticket_id: int, current_user: User, obj_in: TicketResolver
    ) -> TicketMantenimiento:
        CRUDTicketsMantenimiento._require_roles(current_user, {"admin", "tecnico"})

        ticket = await CRUDTicketsMantenimiento.get(db, ticket_id, current_user=current_user)
        if ticket.estado != EstadoTicketMantenimiento.en_revision:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se puede terminar un ticket en revisión",
            )

        recurso = await CRUDTicketsMantenimiento._get_recurso(
            db, ticket.tipo_recurso, ticket.recurso_id
        )

        estado_anterior = ticket.estado
        ticket.estado = EstadoTicketMantenimiento.terminado
        ticket.tecnico_ci = current_user.ci
        ticket.resultado_revision = obj_in.resultado_revision
        ticket.observacion_tecnica = obj_in.observacion_tecnica.strip()
        ticket.fecha_cierre = CRUDTicketsMantenimiento._now()
        ticket.actualizado_en = CRUDTicketsMantenimiento._now()

        estado_catalogo = await CRUDTicketsMantenimiento._get_estado_catalogo_id(
            db,
            tipo_recurso=ticket.tipo_recurso,
            resultado_revision=obj_in.resultado_revision,
        )

        if estado_catalogo:
            field_name, estado_id = estado_catalogo
            setattr(recurso, field_name, estado_id)
            db.add(recurso)

        CRUDTicketsMantenimiento._add_historial(
            db,
            ticket.id,
            estado_anterior,
            EstadoTicketMantenimiento.terminado,
            current_user.ci,
            obj_in.observacion_tecnica.strip(),
        )

        await db.commit()
        await db.refresh(ticket)
        return await CRUDTicketsMantenimiento.get(db, ticket.id, current_user=current_user)

    @staticmethod
    async def cancelar(
        db: AsyncSession, *, ticket_id: int, current_user: User, obj_in: TicketCancelar
    ) -> TicketMantenimiento:
        CRUDTicketsMantenimiento._require_roles(current_user, {"docente"})

        ticket = await CRUDTicketsMantenimiento.get(db, ticket_id, current_user=current_user)
        if ticket.reportante_ci != current_user.ci:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes cancelar tus propios tickets",
            )
        if ticket.estado != EstadoTicketMantenimiento.pendiente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se puede cancelar un ticket pendiente",
            )

        estado_anterior = ticket.estado
        ticket.estado = EstadoTicketMantenimiento.cancelado
        ticket.fecha_cierre = CRUDTicketsMantenimiento._now()
        ticket.actualizado_en = CRUDTicketsMantenimiento._now()

        CRUDTicketsMantenimiento._add_historial(
            db,
            ticket.id,
            estado_anterior,
            EstadoTicketMantenimiento.cancelado,
            current_user.ci,
            obj_in.comentario or "Ticket cancelado por el reportante",
        )

        await db.commit()
        await db.refresh(ticket)
        return await CRUDTicketsMantenimiento.get(db, ticket.id, current_user=current_user)


crud_tickets_mantenimiento = CRUDTicketsMantenimiento()