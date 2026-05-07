# app/crud/crud_infraestructura.py
from app.crud.base import CRUDBase
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.infraestructura import Ubicacion, Invernadero, Atrapaniebla, FuenteAgua
from app.schemas.infraestructura import (
    UbicacionCreate, UbicacionUpdate,
    InvernaderoCreate, InvernaderoUpdate,
    AtrapanieblaCreate, AtrapanieblaUpdate,
    FuenteAguaCreate, FuenteAguaUpdate
)
from app.models.infraestructura import FuenteAgua, FuenteAguaAtrapaniebla
from app.schemas.infraestructura import (
    FuenteAguaCreate,
    FuenteAguaUpdate,
    FuenteAguaAtrapanieblaCreate,
)

class CRUDUbicacion(CRUDBase[Ubicacion, UbicacionCreate, UbicacionUpdate]): pass
class CRUDInvernadero(CRUDBase[Invernadero, InvernaderoCreate, InvernaderoUpdate]): pass
class CRUDAtrapaniebla(CRUDBase[Atrapaniebla, AtrapanieblaCreate, AtrapanieblaUpdate]): pass
class CRUDFuenteAgua(CRUDBase[FuenteAgua, FuenteAguaCreate, FuenteAguaUpdate]): pass

ubicacion = CRUDUbicacion(Ubicacion)
invernadero = CRUDInvernadero(Invernadero)
atrapaniebla = CRUDAtrapaniebla(Atrapaniebla)
fuente_agua = CRUDFuenteAgua(FuenteAgua)

# ===== FUENTES DE AGUA =====
def get_fuentes_agua(db: Session):
    return db.query(FuenteAgua).order_by(FuenteAgua.id.desc()).all()

def get_fuente_agua(db: Session, fuente_id: int):
    fuente = db.query(FuenteAgua).filter(FuenteAgua.id == fuente_id).first()
    if not fuente:
        raise HTTPException(status_code=404, detail="Fuente de agua no encontrada")
    return fuente

def create_fuente_agua(db: Session, fuente_in: FuenteAguaCreate):
    existente = db.query(FuenteAgua).filter(FuenteAgua.codigo == fuente_in.codigo).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una fuente de agua con ese código")

    fuente = FuenteAgua(
        ubicacion_id=fuente_in.ubicacion_id,
        tipo_fuente_agua_id=fuente_in.tipo_fuente_agua_id,
        codigo=fuente_in.codigo,
        nombre=fuente_in.nombre,
        descripcion=fuente_in.descripcion,
        capacidad_l=fuente_in.capacidad_l,
        estado_fuente_agua_id=fuente_in.estado_fuente_agua_id,
    )
    db.add(fuente)
    db.commit()
    db.refresh(fuente)
    return fuente

def update_fuente_agua(db: Session, fuente_id: int, fuente_in: FuenteAguaUpdate):
    fuente = get_fuente_agua(db, fuente_id)

    data = fuente_in.model_dump(exclude_unset=True)

    if "codigo" in data and data["codigo"] is not None:
        existente = (
            db.query(FuenteAguaBase)
            .filter(FuenteAguaBase.codigo == data["codigo"], FuenteAguaBase.id != fuente_id)
            .first()
        )
        if existente:
            raise HTTPException(status_code=400, detail="Ya existe una fuente de agua con ese código")

    mapping = {
        "ubicacion_id": "ubicacionid",
        "tipo_fuente_agua_id": "tipofuenteaguaid",
        "codigo": "codigo",
        "nombre": "nombre",
        "descripcion": "descripcion",
        "capacidad_l": "capacidadl",
        "estado_fuente_agua_id": "estadofuenteaguaid",
    }

    for key, value in data.items():
        setattr(fuente, mapping[key], value)

    db.commit()
    db.refresh(fuente)
    return fuente

def delete_fuente_agua(db: Session, fuente_id: int):
    fuente = get_fuente_agua(db, fuente_id)
    db.delete(fuente)
    db.commit()
    return {"message": "Fuente de agua eliminada correctamente"}


# ===== RELACIÓN ATRAPANIEBLA - FUENTE =====
def get_relaciones_fuente_atrapaniebla(db: Session):
    return db.query(FuenteAguaAtrapaniebla).order_by(FuenteAguaAtrapaniebla.id.desc()).all()

def create_relacion_fuente_atrapaniebla(db: Session, relacion_in: FuenteAguaAtrapanieblaCreate):
    existente = (
        db.query(FuenteAguaAtrapaniebla)
        .filter(
            FuenteAguaAtrapaniebla.fuente_agua_id == relacion_in.fuente_agua_id,
            FuenteAguaAtrapaniebla.atrapaniebla_id == relacion_in.atrapaniebla_id,
        )
        .first()
    )
    if existente:
        raise HTTPException(status_code=400, detail="La relación ya existe")

    relacion = FuenteAguaAtrapaniebla(
        fuente_agua_id=relacion_in.fuente_agua_id,
        atrapaniebla_id=relacion_in.atrapaniebla_id,
    )
    db.add(relacion)
    db.commit()
    db.refresh(relacion)
    return relacion

def delete_relacion_fuente_atrapaniebla(db: Session, relacion_id: int):
    relacion = (
        db.query(FuenteAguaAtrapanieblaBase)
        .filter(FuenteAguaAtrapanieblaBase.id == relacion_id)
        .first()
    )
    if not relacion:
        raise HTTPException(status_code=404, detail="Relación no encontrada")

    db.delete(relacion)
    db.commit()
    return {"message": "Relación eliminada correctamente"}