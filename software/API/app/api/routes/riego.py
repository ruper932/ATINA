# app/api/routes/riego.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.crud import crud_riego as crud
from app.api.deps import get_current_user
from app.models.user import User

from app.schemas.riego import (
    DecisionRiegoCreate, DecisionRiegoUpdate, DecisionRiegoResponse,
    EventoRiegoCreate, EventoRiegoUpdate, EventoRiegoResponse,
    EstadoRiegoActualCreate, EstadoRiegoActualUpdate, EstadoRiegoActualResponse
)

router = APIRouter()

# ==========================================
# DECISIONES DE RIEGO
# ==========================================
@router.post("/decisiones", response_model=DecisionRiegoResponse, status_code=status.HTTP_201_CREATED)
async def create_decision(
    obj_in: DecisionRiegoCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await crud.decision_riego.create(db=db, obj_in=obj_in)

@router.get("/decisiones", response_model=list[DecisionRiegoResponse])
async def read_decisiones(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await crud.decision_riego.get_multi(db=db, skip=skip, limit=limit)

@router.get("/decisiones/{id}", response_model=DecisionRiegoResponse)
async def read_decision(
    id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    obj = await crud.decision_riego.get(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Decisión de riego no encontrada")
    return obj


# ==========================================
# EVENTOS DE RIEGO
# ==========================================
@router.post("/eventos", response_model=EventoRiegoResponse, status_code=status.HTTP_201_CREATED)
async def create_evento(
    obj_in: EventoRiegoCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await crud.evento_riego.create(db=db, obj_in=obj_in)

@router.get("/eventos", response_model=list[EventoRiegoResponse])
async def read_eventos(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await crud.evento_riego.get_multi(db=db, skip=skip, limit=limit)

@router.put("/eventos/{id}", response_model=EventoRiegoResponse)
async def update_evento(
    id: int, 
    obj_in: EventoRiegoUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    obj = await crud.evento_riego.get(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Evento de riego no encontrado")
    return await crud.evento_riego.update(db=db, db_obj=obj, obj_in=obj_in)


# ==========================================
# ESTADO DE RIEGO ACTUAL
# ==========================================
@router.post("/estado-actual", response_model=EstadoRiegoActualResponse, status_code=status.HTTP_201_CREATED)
async def create_estado_actual(
    obj_in: EstadoRiegoActualCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await crud.estado_riego_actual.create(db=db, obj_in=obj_in)

@router.put("/estado-actual/{id}", response_model=EstadoRiegoActualResponse)
async def update_estado_actual(
    id: int, 
    obj_in: EstadoRiegoActualUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    obj = await crud.estado_riego_actual.get(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Estado actual no encontrado")
    return await crud.estado_riego_actual.update(db=db, db_obj=obj, obj_in=obj_in)