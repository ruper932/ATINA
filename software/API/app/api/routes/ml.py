# app/api/routes/ml.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.crud import crud_ml as crud
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.ml import (
    ModeloMLCreate, ModeloMLUpdate, ModeloMLResponse,
    PrediccionMLCreate, PrediccionMLResponse,
    SimulacionMLCreate, SimulacionMLResponse
)

router = APIRouter()

# --- MODELOS ML ---
@router.post("/modelos", response_model=ModeloMLResponse, status_code=status.HTTP_201_CREATED)
async def create_modelo(obj_in: ModeloMLCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.modelo_ml.create(db=db, obj_in=obj_in)

@router.get("/modelos", response_model=list[ModeloMLResponse])
async def read_modelos(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.modelo_ml.get_multi(db=db, skip=skip, limit=limit)

@router.put("/modelos/{id}", response_model=ModeloMLResponse)
async def update_modelo(id: int, obj_in: ModeloMLUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = await crud.modelo_ml.get(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Modelo no encontrado")
    return await crud.modelo_ml.update(db=db, db_obj=obj, obj_in=obj_in)

# --- PREDICCIONES Y SIMULACIONES (Lectura e Inserción) ---
@router.post("/predicciones", response_model=PrediccionMLResponse, status_code=status.HTTP_201_CREATED)
async def create_prediccion(obj_in: PrediccionMLCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.prediccion_ml.create(db=db, obj_in=obj_in)

@router.get("/predicciones", response_model=list[PrediccionMLResponse])
async def read_predicciones(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.prediccion_ml.get_multi(db=db, skip=skip, limit=limit)

@router.post("/simulaciones", response_model=SimulacionMLResponse, status_code=status.HTTP_201_CREATED)
async def create_simulacion(obj_in: SimulacionMLCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.simulacion_ml.create(db=db, obj_in=obj_in)

@router.get("/simulaciones", response_model=list[SimulacionMLResponse])
async def read_simulaciones(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.simulacion_ml.get_multi(db=db, skip=skip, limit=limit)