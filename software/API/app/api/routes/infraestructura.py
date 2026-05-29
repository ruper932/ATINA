# app/api/routes/infraestructura.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.db import get_db
from app.crud import crud_infraestructura as crud
from app.api.deps import get_current_user
from app.models.user import User

from app.schemas.infraestructura import (
    UbicacionCreate, UbicacionUpdate, UbicacionResponse,
    InvernaderoCreate, InvernaderoUpdate, InvernaderoResponse,
    AtrapanieblaCreate, AtrapanieblaUpdate, AtrapanieblaResponse,
    FuenteAguaCreate,
    FuenteAguaUpdate,
    FuenteAguaResponse,
    FuenteAguaAtrapanieblaCreate,
    FuenteAguaAtrapanieblaResponse,
)

router = APIRouter()


# ==========================================
# CATÁLOGOS NECESARIOS PARA INFRAESTRUCTURA
# ==========================================

@router.get("/catalogos/tipos-ubicacion")
async def get_tipos_ubicacion(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(text("SELECT id, nombre, descripcion FROM tipos_ubicacion"))
    rows = result.fetchall()

    data = []
    for row in rows:
        data.append({
            "id": getattr(row, "id", row[0]),
            "nombre": getattr(row, "nombre", row[1]),
            "descripcion": getattr(row, "descripcion", row[2])
        })

    print(f"Enviando tipos_ubicacion a {current_user.email}: {data}")
    return data


@router.get("/catalogos/estados-invernadero")
async def get_estados_invernadero(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(text("SELECT id, nombre, descripcion FROM estados_invernadero"))
    rows = result.fetchall()

    data = []
    for row in rows:
        data.append({
            "id": getattr(row, "id", row[0]),
            "nombre": getattr(row, "nombre", row[1]),
            "descripcion": getattr(row, "descripcion", row[2]),
        })

    return data


@router.get("/catalogos/estados-atrapaniebla")
async def get_estados_atrapaniebla(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(text("SELECT id, nombre, descripcion FROM estados_atrapaniebla"))
    rows = result.fetchall()

    data = []
    for row in rows:
        data.append({
            "id": getattr(row, "id", row[0]),
            "nombre": getattr(row, "nombre", row[1]),
            "descripcion": getattr(row, "descripcion", row[2])
        })

    return data


@router.get("/catalogos/tipos-fuente-agua")
async def get_tipos_fuente_agua(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(text("SELECT id, nombre, descripcion FROM tipos_fuente_agua"))
    rows = result.fetchall()

    data = []
    for row in rows:
        data.append({
            "id": getattr(row, "id", row[0]),
            "nombre": getattr(row, "nombre", row[1]),
            "descripcion": getattr(row, "descripcion", row[2])
        })

    return data


@router.get("/catalogos/estados-fuente-agua")
async def get_estados_fuente_agua(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(text("SELECT id, nombre, descripcion FROM estados_fuente_agua"))
    rows = result.fetchall()

    data = []
    for row in rows:
        data.append({
            "id": getattr(row, "id", row[0]),
            "nombre": getattr(row, "nombre", row[1]),
            "descripcion": getattr(row, "descripcion", row[2])
        })

    return data


# ==========================================
# UBICACIONES
# ==========================================
@router.post("/ubicaciones", response_model=UbicacionResponse, status_code=status.HTTP_201_CREATED)
async def create_ubicacion(
    obj_in: UbicacionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.ubicacion.create(db=db, obj_in=obj_in)


@router.get("/ubicaciones", response_model=list[UbicacionResponse])
async def read_ubicaciones(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.ubicacion.get_multi(db=db, skip=skip, limit=limit)


@router.get("/ubicaciones/{id}", response_model=UbicacionResponse)
async def read_ubicacion(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = await crud.ubicacion.get(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    return obj


@router.put("/ubicaciones/{id}", response_model=UbicacionResponse)
async def update_ubicacion(
    id: int,
    obj_in: UbicacionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = await crud.ubicacion.get(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    return await crud.ubicacion.update(db=db, db_obj=obj, obj_in=obj_in)


@router.delete("/ubicaciones/{id}", response_model=UbicacionResponse)
async def delete_ubicacion(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = await crud.ubicacion.remove(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    return obj


# ==========================================
# INVERNADEROS
# ==========================================
@router.post("/invernaderos", response_model=InvernaderoResponse, status_code=status.HTTP_201_CREATED)
async def create_invernadero(
    obj_in: InvernaderoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    created = await crud.invernadero.create(db=db, obj_in=obj_in)

    result = await db.execute(
        text("""
            SELECT
                i.id,
                i.ubicacion_id,
                u.nombre AS ubicacion_nombre,
                i.codigo,
                i.nombre,
                i.descripcion,
                i.area_m2,
                i.prioridad_riego,
                i.estado_invernadero_id,
                ei.nombre AS estado_invernadero_nombre,
                i.creado_en
            FROM invernaderos i
            INNER JOIN ubicaciones u ON u.id = i.ubicacion_id
            INNER JOIN estados_invernadero ei ON ei.id = i.estado_invernadero_id
            WHERE i.id = :id
        """),
        {"id": created.id},
    )

    row = result.mappings().first()
    return dict(row)


@router.get("/invernaderos", response_model=list[InvernaderoResponse])
async def read_invernaderos(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        text("""
            SELECT
                i.id,
                i.ubicacion_id,
                u.nombre AS ubicacion_nombre,
                i.codigo,
                i.nombre,
                i.descripcion,
                i.area_m2,
                i.prioridad_riego,
                i.estado_invernadero_id,
                ei.nombre AS estado_invernadero_nombre,
                i.creado_en
            FROM invernaderos i
            INNER JOIN ubicaciones u ON u.id = i.ubicacion_id
            INNER JOIN estados_invernadero ei ON ei.id = i.estado_invernadero_id
            ORDER BY i.id
            OFFSET :skip
            LIMIT :limit
        """),
        {"skip": skip, "limit": limit},
    )

    rows = result.mappings().all()
    return [dict(row) for row in rows]


@router.get("/invernaderos/{id}", response_model=InvernaderoResponse)
async def read_invernadero(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        text("""
            SELECT
                i.id,
                i.ubicacion_id,
                u.nombre AS ubicacion_nombre,
                i.codigo,
                i.nombre,
                i.descripcion,
                i.area_m2,
                i.prioridad_riego,
                i.estado_invernadero_id,
                ei.nombre AS estado_invernadero_nombre,
                i.creado_en
            FROM invernaderos i
            INNER JOIN ubicaciones u ON u.id = i.ubicacion_id
            INNER JOIN estados_invernadero ei ON ei.id = i.estado_invernadero_id
            WHERE i.id = :id
        """),
        {"id": id},
    )

    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Invernadero no encontrado")
    return dict(row)


@router.put("/invernaderos/{id}", response_model=InvernaderoResponse)
async def update_invernadero(
    id: int,
    obj_in: InvernaderoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = await crud.invernadero.get(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Invernadero no encontrado")

    await crud.invernadero.update(db=db, db_obj=obj, obj_in=obj_in)

    result = await db.execute(
        text("""
            SELECT
                i.id,
                i.ubicacion_id,
                u.nombre AS ubicacion_nombre,
                i.codigo,
                i.nombre,
                i.descripcion,
                i.area_m2,
                i.prioridad_riego,
                i.estado_invernadero_id,
                ei.nombre AS estado_invernadero_nombre,
                i.creado_en
            FROM invernaderos i
            INNER JOIN ubicaciones u ON u.id = i.ubicacion_id
            INNER JOIN estados_invernadero ei ON ei.id = i.estado_invernadero_id
            WHERE i.id = :id
        """),
        {"id": id},
    )

    row = result.mappings().first()
    return dict(row)


@router.delete("/invernaderos/{id}", response_model=InvernaderoResponse)
async def delete_invernadero(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        text("""
            SELECT
                i.id,
                i.ubicacion_id,
                u.nombre AS ubicacion_nombre,
                i.codigo,
                i.nombre,
                i.descripcion,
                i.area_m2,
                i.prioridad_riego,
                i.estado_invernadero_id,
                ei.nombre AS estado_invernadero_nombre,
                i.creado_en
            FROM invernaderos i
            INNER JOIN ubicaciones u ON u.id = i.ubicacion_id
            INNER JOIN estados_invernadero ei ON ei.id = i.estado_invernadero_id
            WHERE i.id = :id
        """),
        {"id": id},
    )

    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Invernadero no encontrado")

    await crud.invernadero.remove(db=db, id=id)
    return dict(row)


# ==========================================
# ATRAPANIEBLAS
# ==========================================
@router.post("/atrapanieblas", response_model=AtrapanieblaResponse, status_code=status.HTTP_201_CREATED)
async def create_atrapaniebla(
    obj_in: AtrapanieblaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.atrapaniebla.create(db=db, obj_in=obj_in)


@router.get("/atrapanieblas", response_model=list[AtrapanieblaResponse])
async def read_atrapanieblas(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.atrapaniebla.get_multi(db=db, skip=skip, limit=limit)


@router.get("/atrapanieblas/{id}", response_model=AtrapanieblaResponse)
async def read_atrapaniebla(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = await crud.atrapaniebla.get(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Atrapaniebla no encontrado")
    return obj


@router.put("/atrapanieblas/{id}", response_model=AtrapanieblaResponse)
async def update_atrapaniebla(
    id: int,
    obj_in: AtrapanieblaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = await crud.atrapaniebla.get(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Atrapaniebla no encontrado")
    return await crud.atrapaniebla.update(db=db, db_obj=obj, obj_in=obj_in)


@router.delete("/atrapanieblas/{id}", response_model=AtrapanieblaResponse)
async def delete_atrapaniebla(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = await crud.atrapaniebla.remove(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Atrapaniebla no encontrado")
    return obj


# ===== FUENTES DE AGUA =====
@router.get("/fuentes-agua", response_model=list[FuenteAguaResponse])
async def listar_fuentes_agua(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.get_fuentes_agua(db)


@router.get("/fuentes-agua/{fuente_id}", response_model=FuenteAguaResponse)
async def obtener_fuente_agua(
    fuente_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.get_fuente_agua(db, fuente_id)


@router.post("/fuentes-agua", response_model=FuenteAguaResponse, status_code=status.HTTP_201_CREATED)
async def crear_fuente_agua(
    fuente_in: FuenteAguaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.create_fuente_agua(db, fuente_in)


@router.put("/fuentes-agua/{fuente_id}", response_model=FuenteAguaResponse)
async def actualizar_fuente_agua(
    fuente_id: int,
    fuente_in: FuenteAguaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.update_fuente_agua(db, fuente_id, fuente_in)


@router.delete("/fuentes-agua/{fuente_id}")
async def eliminar_fuente_agua(
    fuente_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.delete_fuente_agua(db, fuente_id)


# ===== RELACIÓN FUENTE-ATRAPANIEBLA =====
@router.get("/fuentes-agua-atrapanieblas", response_model=list[FuenteAguaAtrapanieblaResponse])
async def listar_relaciones_fuente_atrapaniebla(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.get_relaciones_fuente_atrapaniebla(db)


@router.post("/fuentes-agua-atrapanieblas", response_model=FuenteAguaAtrapanieblaResponse, status_code=status.HTTP_201_CREATED)
async def crear_relacion_fuente_atrapaniebla(
    relacion_in: FuenteAguaAtrapanieblaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.create_relacion_fuente_atrapaniebla(db, relacion_in)


@router.delete("/fuentes-agua-atrapanieblas/{relacion_id}")
async def eliminar_relacion_fuente_atrapaniebla(
    relacion_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.delete_relacion_fuente_atrapaniebla(db, relacion_id)