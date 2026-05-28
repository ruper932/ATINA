from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.infraestructura import Atrapaniebla, FuenteAgua, Ubicacion
from app.models.solicitudes import (
    EstadoSolicitud,
    HistorialSolicitud,
    SolicitudMovimiento,
    TipoRecursoSolicitud,
)
from app.models.user import User
from app.schemas.solicitudes import (
    SolicitudCancelar,
    SolicitudMovimientoCreate,
    SolicitudResolver,
    SolicitudTomarRevision,
)


class CRUDSolicitudes:
    @staticmethod
    def _now() -> datetime:
        return datetime.now(timezone.utc)

    @staticmethod
    def _get_user_role_name(user: User) -> str | None:
        rol = getattr(user, "rol", None)
        if rol and getattr(rol, "nombre", None):
            return rol.nombre.lower()
        return None

    @staticmethod
    def _require_roles(user: User, allowed: set[str]) -> None:
        role_name = CRUDSolicitudes._get_user_role_name(user)
        if role_name not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción",
            )

    @staticmethod
    async def _get_recurso_actual(
        db: AsyncSession,
        tipo_recurso: TipoRecursoSolicitud,
        recurso_id: int,
    ):
        if tipo_recurso == TipoRecursoSolicitud.atrapaniebla:
            recurso = await db.get(Atrapaniebla, recurso_id)
        elif tipo_recurso == TipoRecursoSolicitud.fuenteagua:
            recurso = await db.get(FuenteAgua, recurso_id)
        else:
            recurso = None

        if not recurso:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recurso no encontrado",
            )
        return recurso

    @staticmethod
    async def _validate_ubicacion(db: AsyncSession, ubicacion_id: int) -> None:
        ubicacion = await db.get(Ubicacion, ubicacion_id)
        if not ubicacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ubicación no encontrada",
            )

    @staticmethod
    def _add_historial(
        db: AsyncSession,
        solicitud_id: int,
        estado_anterior: EstadoSolicitud | None,
        estado_nuevo: EstadoSolicitud,
        actor_ci: str | None,
        comentario: str | None = None,
        pdf_url: str | None = None,
    ) -> HistorialSolicitud:
        historial = HistorialSolicitud(
            solicitud_id=solicitud_id,
            estado_anterior=estado_anterior,
            estado_nuevo=estado_nuevo,
            actor_ci=actor_ci,
            comentario=comentario,
            pdf_url=pdf_url,
        )
        db.add(historial)
        return historial

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        current_user: User,
        obj_in: SolicitudMovimientoCreate,
    ) -> SolicitudMovimiento:
        CRUDSolicitudes._require_roles(current_user, {"docente"})

        recurso = await CRUDSolicitudes._get_recurso_actual(
            db, obj_in.tipo_recurso, obj_in.recurso_id
        )

        ubicacion_actual_id = getattr(recurso, "ubicacion_id", None)
        if ubicacion_actual_id is None:
            ubicacion_actual_id = getattr(recurso, "ubicacionid", None)

        if obj_in.ubicacion_destino_id:
            await CRUDSolicitudes._validate_ubicacion(db, obj_in.ubicacion_destino_id)
            if ubicacion_actual_id == obj_in.ubicacion_destino_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La ubicación destino debe ser distinta a la actual",
                )

        solicitud = SolicitudMovimiento(
            tipo_recurso=obj_in.tipo_recurso,
            recurso_id=obj_in.recurso_id,
            solicitante_ci=current_user.ci,
            ubicacion_origen_id=ubicacion_actual_id,
            ubicacion_destino_id=obj_in.ubicacion_destino_id,
            ubicacion_destino_propuesta=obj_in.ubicacion_destino_propuesta,
            motivo=obj_in.motivo.strip(),
            pdf_url=obj_in.pdf_url,
            estado=EstadoSolicitud.pendiente,
        )

        db.add(solicitud)
        await db.flush()

        CRUDSolicitudes._add_historial(
            db,
            solicitud_id=solicitud.id,
            estado_anterior=None,
            estado_nuevo=EstadoSolicitud.pendiente,
            actor_ci=current_user.ci,
            comentario="Solicitud creada",
            pdf_url=obj_in.pdf_url,
        )

        await db.commit()
        await db.refresh(solicitud)
        return solicitud

    @staticmethod
    async def get(db: AsyncSession, solicitud_id: int) -> SolicitudMovimiento:
        stmt = (
            select(SolicitudMovimiento)
            .options(selectinload(SolicitudMovimiento.historial))
            .where(SolicitudMovimiento.id == solicitud_id)
        )
        result = await db.execute(stmt)
        solicitud = result.scalar_one_or_none()

        if not solicitud:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Solicitud no encontrada",
            )
        return solicitud

    @staticmethod
    async def list(
        db: AsyncSession,
        *,
        estado: EstadoSolicitud | None = None,
        solicitante_ci: str | None = None,
        revisor_ci: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[SolicitudMovimiento]:
        stmt = (
            select(SolicitudMovimiento)
            .options(selectinload(SolicitudMovimiento.historial))
            .order_by(SolicitudMovimiento.id.desc())
        )

        if estado:
            stmt = stmt.where(SolicitudMovimiento.estado == estado)
        if solicitante_ci:
            stmt = stmt.where(SolicitudMovimiento.solicitante_ci == solicitante_ci)
        if revisor_ci:
            stmt = stmt.where(SolicitudMovimiento.revisor_ci == revisor_ci)

        stmt = stmt.offset(skip).limit(limit)

        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def tomar_revision(
        db: AsyncSession,
        *,
        solicitud_id: int,
        current_user: User,
        obj_in: SolicitudTomarRevision,
    ) -> SolicitudMovimiento:
        CRUDSolicitudes._require_roles(current_user, {"admin", "tecnico"})

        solicitud = await CRUDSolicitudes.get(db, solicitud_id)

        if solicitud.estado != EstadoSolicitud.pendiente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se puede tomar en revisión una solicitud pendiente",
            )

        estado_anterior = solicitud.estado
        solicitud.estado = EstadoSolicitud.en_revision
        solicitud.revisor_ci = current_user.ci
        solicitud.fecha_revision = CRUDSolicitudes._now()
        solicitud.actualizado_en = CRUDSolicitudes._now()

        CRUDSolicitudes._add_historial(
            db,
            solicitud_id=solicitud.id,
            estado_anterior=estado_anterior,
            estado_nuevo=EstadoSolicitud.en_revision,
            actor_ci=current_user.ci,
            comentario=obj_in.comentario or "Solicitud tomada en revisión",
        )

        await db.commit()
        await db.refresh(solicitud)
        return await CRUDSolicitudes.get(db, solicitud.id)

    @staticmethod
    async def _aplicar_ubicacion(
        db: AsyncSession,
        *,
        tipo_recurso: TipoRecursoSolicitud,
        recurso_id: int,
        ubicacion_destino_id: int,
    ) -> None:
        recurso = await CRUDSolicitudes._get_recurso_actual(db, tipo_recurso, recurso_id)

        if hasattr(recurso, "ubicacion_id"):
            recurso.ubicacion_id = ubicacion_destino_id
        elif hasattr(recurso, "ubicacionid"):
            recurso.ubicacionid = ubicacion_destino_id

        db.add(recurso)

    @staticmethod
    async def resolver(
        db: AsyncSession,
        *,
        solicitud_id: int,
        current_user: User,
        obj_in: SolicitudResolver,
    ) -> SolicitudMovimiento:
        CRUDSolicitudes._require_roles(current_user, {"admin", "tecnico"})

        solicitud = await CRUDSolicitudes.get(db, solicitud_id)

        if solicitud.estado != EstadoSolicitud.en_revision:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se puede resolver una solicitud en revisión",
            )

        estado_anterior = solicitud.estado
        nuevo_estado = (
            EstadoSolicitud.aprobada if obj_in.aprobar else EstadoSolicitud.rechazada
        )

        if obj_in.aprobar:
            if obj_in.ubicacion_destino_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Debes indicar una ubicación destino al aprobar",
                )

            await CRUDSolicitudes._validate_ubicacion(db, obj_in.ubicacion_destino_id)

            if solicitud.ubicacion_origen_id == obj_in.ubicacion_destino_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La ubicación destino debe ser distinta a la ubicación de origen",
                )

            solicitud.ubicacion_destino_id = obj_in.ubicacion_destino_id

            await CRUDSolicitudes._aplicar_ubicacion(
                db,
                tipo_recurso=solicitud.tipo_recurso,
                recurso_id=solicitud.recurso_id,
                ubicacion_destino_id=obj_in.ubicacion_destino_id,
            )

        solicitud.estado = nuevo_estado
        solicitud.revisor_ci = current_user.ci
        solicitud.observacion = obj_in.observacion.strip()
        solicitud.pdf_url = obj_in.pdf_url
        solicitud.fecha_resolucion = CRUDSolicitudes._now()
        solicitud.actualizado_en = CRUDSolicitudes._now()

        CRUDSolicitudes._add_historial(
            db,
            solicitud_id=solicitud.id,
            estado_anterior=estado_anterior,
            estado_nuevo=nuevo_estado,
            actor_ci=current_user.ci,
            comentario=obj_in.observacion.strip(),
            pdf_url=obj_in.pdf_url,
        )

        await db.commit()
        await db.refresh(solicitud)
        return await CRUDSolicitudes.get(db, solicitud.id)

    @staticmethod
    async def cancelar(
        db: AsyncSession,
        *,
        solicitud_id: int,
        current_user: User,
        obj_in: SolicitudCancelar,
    ) -> SolicitudMovimiento:
        CRUDSolicitudes._require_roles(current_user, {"docente"})

        solicitud = await CRUDSolicitudes.get(db, solicitud_id)

        if solicitud.solicitante_ci != current_user.ci:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes cancelar tus propias solicitudes",
            )

        if solicitud.estado != EstadoSolicitud.pendiente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se puede cancelar una solicitud pendiente",
            )

        estado_anterior = solicitud.estado
        solicitud.estado = EstadoSolicitud.cancelada
        solicitud.fecha_resolucion = CRUDSolicitudes._now()
        solicitud.actualizado_en = CRUDSolicitudes._now()

        CRUDSolicitudes._add_historial(
            db,
            solicitud_id=solicitud.id,
            estado_anterior=estado_anterior,
            estado_nuevo=EstadoSolicitud.cancelada,
            actor_ci=current_user.ci,
            comentario=obj_in.comentario or "Solicitud cancelada por el solicitante",
        )

        await db.commit()
        await db.refresh(solicitud)
        return await CRUDSolicitudes.get(db, solicitud.id)


crud_solicitudes = CRUDSolicitudes()