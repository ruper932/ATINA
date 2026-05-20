# app/crud/crud_infraestructura.py
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.infraestructura import (
    Ubicacion,
    Invernadero,
    Atrapaniebla,
    FuenteAgua,
    FuenteAguaAtrapaniebla,
)
from app.schemas.infraestructura import (
    UbicacionCreate,
    UbicacionUpdate,
    InvernaderoCreate,
    InvernaderoUpdate,
    AtrapanieblaCreate,
    AtrapanieblaUpdate,
    FuenteAguaCreate,
    FuenteAguaUpdate,
    FuenteAguaAtrapanieblaCreate,
)


class CRUDUbicacion(CRUDBase[Ubicacion, UbicacionCreate, UbicacionUpdate]):
    pass


class CRUDInvernadero(CRUDBase[Invernadero, InvernaderoCreate, InvernaderoUpdate]):
    pass


class CRUDAtrapaniebla(CRUDBase[Atrapaniebla, AtrapanieblaCreate, AtrapanieblaUpdate]):
    pass


class CRUDFuenteAgua(CRUDBase[FuenteAgua, FuenteAguaCreate, FuenteAguaUpdate]):
    pass


ubicacion = CRUDUbicacion(Ubicacion)
invernadero = CRUDInvernadero(Invernadero)
atrapaniebla = CRUDAtrapaniebla(Atrapaniebla)
fuente_agua = CRUDFuenteAgua(FuenteAgua)


# ===== FUENTES DE AGUA =====
async def get_fuentes_agua(db: AsyncSession):
    stmt = select(FuenteAgua).order_by(FuenteAgua.id.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_fuente_agua(db: AsyncSession, fuente_id: int):
    fuente = await db.get(FuenteAgua, fuente_id)
    if not fuente:
        raise HTTPException(status_code=404, detail="Fuente de agua no encontrada")
    return fuente


async def create_fuente_agua(db: AsyncSession, fuente_in: FuenteAguaCreate):
    stmt = select(FuenteAgua).where(FuenteAgua.codigo == fuente_in.codigo)
    result = await db.execute(stmt)
    existente = result.scalars().first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una fuente de agua con ese código")

    fuente = FuenteAgua(**fuente_in.model_dump())
    db.add(fuente)
    await db.commit()
    await db.refresh(fuente)
    return fuente


async def update_fuente_agua(db: AsyncSession, fuente_id: int, fuente_in: FuenteAguaUpdate):
    fuente = await get_fuente_agua(db, fuente_id)
    data = fuente_in.model_dump(exclude_unset=True)

    if "codigo" in data and data["codigo"] is not None:
        stmt = select(FuenteAgua).where(
            FuenteAgua.codigo == data["codigo"],
            FuenteAgua.id != fuente_id,
        )
        result = await db.execute(stmt)
        existente = result.scalars().first()

        if existente:
            raise HTTPException(status_code=400, detail="Ya existe una fuente de agua con ese código")

    for key, value in data.items():
        setattr(fuente, key, value)

    await db.commit()
    await db.refresh(fuente)
    return fuente


async def delete_fuente_agua(db: AsyncSession, fuente_id: int):
    fuente = await get_fuente_agua(db, fuente_id)
    await db.delete(fuente)
    await db.commit()
    return {"message": "Fuente de agua eliminada correctamente"}


# ===== RELACIÓN ATRAPANIEBLA - FUENTE =====
async def get_relaciones_fuente_atrapaniebla(db: AsyncSession):
    stmt = select(FuenteAguaAtrapaniebla).order_by(FuenteAguaAtrapaniebla.id.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_relacion_fuente_atrapaniebla(
    db: AsyncSession,
    relacion_in: FuenteAguaAtrapanieblaCreate,
):
    stmt = select(FuenteAguaAtrapaniebla).where(
        FuenteAguaAtrapaniebla.fuente_agua_id == relacion_in.fuente_agua_id,
        FuenteAguaAtrapaniebla.atrapaniebla_id == relacion_in.atrapaniebla_id,
    )
    result = await db.execute(stmt)
    existente = result.scalars().first()

    if existente:
        raise HTTPException(status_code=400, detail="La relación ya existe")

    relacion = FuenteAguaAtrapaniebla(**relacion_in.model_dump())
    db.add(relacion)
    await db.commit()
    await db.refresh(relacion)
    return relacion


async def delete_relacion_fuente_atrapaniebla(db: AsyncSession, relacion_id: int):
    relacion = await db.get(FuenteAguaAtrapaniebla, relacion_id)
    if not relacion:
        raise HTTPException(status_code=404, detail="Relación no encontrada")

    await db.delete(relacion)
    await db.commit()
    return {"message": "Relación eliminada correctamente"}