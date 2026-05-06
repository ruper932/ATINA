# app/routes/invernaderos.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.crud.crud_invernadero import invernadero
from app.schemas.infraestructura import InvernaderoCreate, InvernaderoUpdate, InvernaderoResponse

# IMPORTAR LA DEPENDENCIA DE SEGURIDAD
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=InvernaderoResponse, status_code=status.HTTP_201_CREATED)
async def create_invernadero(
    *,
    db: AsyncSession = Depends(get_db),
    invernadero_in: InvernaderoCreate,
    current_user: User = Depends(get_current_user)  # PROTECCIÓN AÑADIDA
):
    """Crea un nuevo invernadero."""
    return await invernadero.create(db=db, obj_in=invernadero_in)

@router.get("/", response_model=list[InvernaderoResponse])
async def read_invernaderos(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # PROTECCIÓN AÑADIDA
):
    """Obtiene la lista de invernaderos paginada."""
    return await invernadero.get_multi(db=db, skip=skip, limit=limit)

@router.get("/{id}", response_model=InvernaderoResponse)
async def read_invernadero(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # PROTECCIÓN AÑADIDA
):
    """Obtiene un invernadero específico por ID."""
    db_obj = await invernadero.get(db=db, id=id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Invernadero no encontrado")
    return db_obj

@router.put("/{id}", response_model=InvernaderoResponse)
async def update_invernadero(
    id: int,
    invernadero_in: InvernaderoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # PROTECCIÓN AÑADIDA
):
    """Actualiza un invernadero."""
    db_obj = await invernadero.get(db=db, id=id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Invernadero no encontrado")
    return await invernadero.update(db=db, db_obj=db_obj, obj_in=invernadero_in)

@router.delete("/{id}", response_model=InvernaderoResponse)
async def delete_invernadero(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # PROTECCIÓN AÑADIDA
):
    """Elimina un invernadero."""
    db_obj = await invernadero.remove(db=db, id=id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Invernadero no encontrado")
    return db_obj