# app/api/routes/dispositivos.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.db import get_db
from app.crud import crud_dispositivos as crud
from app.api.deps import get_current_user
from app.models.user import User

from app.schemas.dispositivos import (
    DispositivoCreate, DispositivoUpdate, DispositivoResponse,
    SensorCreate, SensorUpdate, SensorResponse,
    LecturaSensorCreate, LecturaSensorResponse,
    ActuadorCreate, ActuadorUpdate, ActuadorResponse
)

router = APIRouter()

# ==========================================
# CATÁLOGOS (Rutas estáticas específicas)
# ==========================================
@router.get("/catalogos/tipos-dispositivo")
async def get_tipos_dispositivo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Nota: Asegúrate de que el nombre de la tabla coincida con tu BD (tipos_dispositivo o tiposdispositivo)
    result = await db.execute(text("SELECT id, nombre, descripcion FROM tipos_dispositivo"))
    return [dict(row) for row in result.mappings()]

@router.get("/catalogos/estados-dispositivo")
async def get_estados_dispositivo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(text("SELECT id, nombre, descripcion FROM estados_dispositivo"))
    return [dict(row) for row in result.mappings()]

@router.get("/catalogos/tipos-sensor")
async def get_tipos_sensor(
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user), # Si usas auth
):
    result = await db.execute(text("SELECT id, nombre, descripcion FROM tipos_sensor"))
    return [dict(row) for row in result.mappings()]

@router.get("/catalogos/estados-sensor")
async def get_estados_sensor(
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user), # Si usas auth
):
    result = await db.execute(text("SELECT id, nombre, descripcion FROM estados_sensor"))
    return [dict(row) for row in result.mappings()]


# ==========================================
# DISPOSITIVOS (Rutas estáticas base)
# ==========================================
@router.post("/", response_model=DispositivoResponse, status_code=status.HTTP_201_CREATED)
async def create_dispositivo(obj_in: DispositivoCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Convertimos el IP a string si viene como objeto IPvAnyAddress
    if obj_in.ip_local: obj_in.ip_local = str(obj_in.ip_local)
    return await crud.dispositivo.create(db=db, obj_in=obj_in)

@router.get("/", response_model=list[DispositivoResponse])
async def read_dispositivos(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.dispositivo.get_multi(db=db, skip=skip, limit=limit)


# ==========================================
# SENSORES
# ==========================================
@router.post("/sensores", response_model=SensorResponse, status_code=status.HTTP_201_CREATED)
async def create_sensor(obj_in: SensorCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.sensor.create(db=db, obj_in=obj_in)

@router.get("/sensores", response_model=list[SensorResponse])
async def read_sensores(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.sensor.get_multi(db=db, skip=skip, limit=limit)

@router.get("/sensores/{id}", response_model=SensorResponse)
async def read_sensor(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = await crud.sensor.get(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Sensor no encontrado")
    return obj

@router.put("/sensores/{id}", response_model=SensorResponse)
async def update_sensor(id: int, obj_in: SensorUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = await crud.sensor.get(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Sensor no encontrado")
    return await crud.sensor.update(db=db, db_obj=obj, obj_in=obj_in)


# ==========================================
# LECTURAS (Solo GET y POST)
# ==========================================
@router.post("/lecturas", response_model=LecturaSensorResponse, status_code=status.HTTP_201_CREATED)
async def create_lectura(obj_in: LecturaSensorCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Los sensores (ESP32) insertarán aquí sus datos
    return await crud.lectura_sensor.create(db=db, obj_in=obj_in)

@router.get("/lecturas", response_model=list[LecturaSensorResponse])
async def read_lecturas(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.lectura_sensor.get_multi(db=db, skip=skip, limit=limit)


# ==========================================
# ACTUADORES
# ==========================================
@router.post("/actuadores", response_model=ActuadorResponse, status_code=status.HTTP_201_CREATED)
async def create_actuador(obj_in: ActuadorCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.actuador.create(db=db, obj_in=obj_in)

@router.get("/actuadores", response_model=list[ActuadorResponse])
async def read_actuadores(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.actuador.get_multi(db=db, skip=skip, limit=limit)

@router.get("/actuadores/{id}", response_model=ActuadorResponse)
async def read_actuador(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = await crud.actuador.get(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Actuador no encontrado")
    return obj

@router.put("/actuadores/{id}", response_model=ActuadorResponse)
async def update_actuador(id: int, obj_in: ActuadorUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = await crud.actuador.get(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Actuador no encontrado")
    return await crud.actuador.update(db=db, db_obj=obj, obj_in=obj_in)


# ==========================================
# DISPOSITIVOS (Rutas DINÁMICAS al final)
# ==========================================
@router.get("/{id}", response_model=DispositivoResponse)
async def read_dispositivo(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = await crud.dispositivo.get(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    return obj

@router.put("/{id}", response_model=DispositivoResponse)
async def update_dispositivo(id: int, obj_in: DispositivoUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = await crud.dispositivo.get(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    if obj_in.ip_local: obj_in.ip_local = str(obj_in.ip_local)
    return await crud.dispositivo.update(db=db, db_obj=obj, obj_in=obj_in)

@router.delete("/{id}", response_model=DispositivoResponse)
async def delete_dispositivo(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = await crud.dispositivo.remove(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    return obj