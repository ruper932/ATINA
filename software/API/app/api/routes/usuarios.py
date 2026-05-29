from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_superuser
from app.core.db import get_db
from app.core.rate_limit import limiter
from app.crud import crud_usuarios as crud
from app.models.user import User
from app.schemas.usuarios import (
    EstadoUsuarioCreate,
    EstadoUsuarioResponse,
    EstadoUsuarioUpdate,
    RolCreate,
    RolResponse,
    RolUpdate,
    UserCreate,
    UserResponse,
    UserUpdate,
)

router = APIRouter()


# ==========================================
# ROLES
# ==========================================
@router.post("/roles", response_model=RolResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_rol(
    request: Request,
    obj_in: RolCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    return await crud.rol.create(db=db, obj_in=obj_in)


@router.get("/roles", response_model=list[RolResponse])
async def read_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    return await crud.rol.get_multi(db=db, skip=skip, limit=limit)


@router.put("/roles/{id}", response_model=RolResponse)
@limiter.limit("20/minute")
async def update_rol(
    request: Request,
    id: int,
    obj_in: RolUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    obj = await crud.rol.get(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return await crud.rol.update(db=db, db_obj=obj, obj_in=obj_in)


# ==========================================
# ESTADOS DE USUARIO
# ==========================================
@router.post("/estados", response_model=EstadoUsuarioResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_estado_usuario(
    request: Request,
    obj_in: EstadoUsuarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    return await crud.estado_usuario.create(db=db, obj_in=obj_in)


@router.get("/estados", response_model=list[EstadoUsuarioResponse])
async def read_estados_usuario(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    return await crud.estado_usuario.get_multi(db=db, skip=skip, limit=limit)


@router.put("/estados/{id}", response_model=EstadoUsuarioResponse)
@limiter.limit("20/minute")
async def update_estado_usuario(
    request: Request,
    id: int,
    obj_in: EstadoUsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    obj = await crud.estado_usuario.get(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Estado no encontrado")
    return await crud.estado_usuario.update(db=db, db_obj=obj, obj_in=obj_in)


# ==========================================
# USUARIOS
# ==========================================
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_user(
    request: Request,
    obj_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    return await crud.user.create(db=db, obj_in=obj_in)


@router.get("/", response_model=list[UserResponse])
async def read_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    return await crud.user.get_multi(db=db, skip=skip, limit=limit)


@router.get("/{ci}", response_model=UserResponse)
async def read_user(
    ci: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    obj = await crud.user.get(db=db, id=ci)
    if not obj:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return obj


@router.put("/{ci}", response_model=UserResponse)
@limiter.limit("20/minute")
async def update_user(
    request: Request,
    ci: str,
    obj_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    obj = await crud.user.get(db=db, id=ci)
    if not obj:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return await crud.user.update(db=db, db_obj=obj, obj_in=obj_in)


@router.delete("/{ci}", response_model=UserResponse)
@limiter.limit("10/minute")
async def delete_user(
    request: Request,
    ci: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    if ci == current_user.ci:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario")

    obj = await crud.user.remove(db=db, id=ci)
    if not obj:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return obj