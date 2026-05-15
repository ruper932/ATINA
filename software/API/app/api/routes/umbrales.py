from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.crud import crud_umbrales as crud
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.umbrales import (
    ParametroUmbralCreate, ParametroUmbralUpdate, ParametroUmbralResponse,
    ConfiguracionUmbralCreate, ConfiguracionUmbralUpdate, ConfiguracionUmbralResponse
)

router = APIRouter()


@router.post("/parametros", response_model=ParametroUmbralResponse, status_code=status.HTTP_201_CREATED)
async def create_parametro(
    obj_in: ParametroUmbralCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud.parametro_umbral.create(db=db, obj_in=obj_in)


@router.get("/parametros", response_model=list[ParametroUmbralResponse])
async def read_parametros(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud.parametro_umbral.get_multi(db=db, skip=skip, limit=limit)


@router.put("/parametros/{id}", response_model=ParametroUmbralResponse)
async def update_parametro(
    id: int,
    obj_in: ParametroUmbralUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    obj = await crud.parametro_umbral.get(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Parámetro no encontrado")
    return await crud.parametro_umbral.update(db=db, db_obj=obj, obj_in=obj_in)


@router.post("/configuraciones", response_model=ConfiguracionUmbralResponse, status_code=status.HTTP_201_CREATED)
async def create_configuracion(
    obj_in: ConfiguracionUmbralCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    obj_in.actualizado_por_ci = current_user.ci
    return await crud.configuracion_umbral.create(db=db, obj_in=obj_in)


@router.get("/configuraciones", response_model=list[ConfiguracionUmbralResponse])
async def read_configuraciones(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud.configuracion_umbral.get_multi(db=db, skip=skip, limit=limit)


@router.put("/configuraciones/{id}", response_model=ConfiguracionUmbralResponse)
async def update_configuracion(
    id: int,
    obj_in: ConfiguracionUmbralUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    obj = await crud.configuracion_umbral.get(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    obj_in.actualizado_por_ci = current_user.ci
    return await crud.configuracion_umbral.update(db=db, db_obj=obj, obj_in=obj_in)