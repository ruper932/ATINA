# app/api/routes/alertas.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.crud import crud_alertas as crud
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.alertas import (
    AlertaCreate, AlertaUpdate, AlertaResponse,
    NotificacionLocalCreate, NotificacionLocalUpdate, NotificacionLocalResponse
)

router = APIRouter()

# --- ALERTAS ---
@router.post("/", response_model=AlertaResponse, status_code=status.HTTP_201_CREATED)
async def create_alerta(obj_in: AlertaCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.alerta.create(db=db, obj_in=obj_in)

@router.get("/", response_model=list[AlertaResponse])
async def read_alertas(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.alerta.get_multi(db=db, skip=skip, limit=limit)

@router.put("/{id}", response_model=AlertaResponse)
async def update_alerta(id: int, obj_in: AlertaUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = await crud.alerta.get(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Alerta no encontrada")
    return await crud.alerta.update(db=db, db_obj=obj, obj_in=obj_in)

# --- NOTIFICACIONES LOCALES ---
@router.post("/notificaciones", response_model=NotificacionLocalResponse, status_code=status.HTTP_201_CREATED)
async def create_notificacion(obj_in: NotificacionLocalCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.notificacion_local.create(db=db, obj_in=obj_in)

@router.put("/notificaciones/{id}", response_model=NotificacionLocalResponse)
async def update_notificacion(id: int, obj_in: NotificacionLocalUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = await crud.notificacion_local.get(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Notificación no encontrada")
    return await crud.notificacion_local.update(db=db, db_obj=obj, obj_in=obj_in)