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


@router.get("/catalogos/tipos-dispositivo")
async def get_tipos_dispositivo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        text("SELECT id, nombre, descripcion FROM tipos_dispositivo")
    )
    return [dict(row) for row in result.mappings()]


@router.get("/catalogos/estados-dispositivo")
async def get_estados_dispositivo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        text("SELECT id, nombre, descripcion FROM estados_dispositivo")
    )
    return [dict(row) for row in result.mappings()]


@router.get("/catalogos/tipos-sensor")
async def get_tipos_sensor(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT id, nombre, descripcion FROM tipos_sensor")
    )
    return [dict(row) for row in result.mappings()]


@router.get("/catalogos/estados-sensor")
async def get_estados_sensor(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT id, nombre, descripcion FROM estados_sensor")
    )
    return [dict(row) for row in result.mappings()]


@router.post("/", response_model=DispositivoResponse, status_code=status.HTTP_201_CREATED)
async def create_dispositivo(
    obj_in: DispositivoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if obj_in.ip_local:
        obj_in.ip_local = str(obj_in.ip_local)
    return await crud.dispositivo.create(db=db, obj_in=obj_in)


@router.get("/", response_model=list[DispositivoResponse])
async def read_dispositivos(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        text("""
            SELECT
                d.id,
                d.tipo_dispositivo_id,
                td.nombre AS tipo_dispositivo_nombre,
                d.codigo,
                d.nombre,
                d.identificador_local,
                d.ip_local,
                d.version_firmware,
                d.estado_dispositivo_id,
                ed.nombre AS estado_dispositivo_nombre,
                d.ultima_conexion,
                d.creado_en
            FROM dispositivos d
            INNER JOIN tipos_dispositivo td ON td.id = d.tipo_dispositivo_id
            INNER JOIN estados_dispositivo ed ON ed.id = d.estado_dispositivo_id
            ORDER BY d.id
            OFFSET :skip
            LIMIT :limit
        """),
        {"skip": skip, "limit": limit},
    )
    rows = result.mappings().all()
    return [dict(row) for row in rows]


@router.post("/sensores", response_model=SensorResponse, status_code=status.HTTP_201_CREATED)
async def create_sensor(
    obj_in: SensorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.sensor.create(db=db, obj_in=obj_in)


@router.get("/sensores", response_model=list[SensorResponse])
async def read_sensores(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        text("""
            SELECT
                s.id,
                s.dispositivo_id,
                d.nombre AS dispositivo_nombre,
                s.tipo_sensor_id,
                ts.nombre AS tipo_sensor_nombre,
                s.codigo,
                s.nombre,
                s.modelo,
                s.numero_serie,
                s.precision_valor,
                s.estado_sensor_id,
                es.nombre AS estado_sensor_nombre,
                s.fecha_instalacion
            FROM sensores s
            INNER JOIN dispositivos d ON d.id = s.dispositivo_id
            INNER JOIN tipos_sensor ts ON ts.id = s.tipo_sensor_id
            INNER JOIN estados_sensor es ON es.id = s.estado_sensor_id
            ORDER BY s.id
            OFFSET :skip
            LIMIT :limit
        """),
        {"skip": skip, "limit": limit},
    )
    rows = result.mappings().all()
    return [dict(row) for row in rows]


@router.get("/sensores/{id}", response_model=SensorResponse)
async def read_sensor(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        text("""
            SELECT
                s.id,
                s.dispositivo_id,
                d.nombre AS dispositivo_nombre,
                s.tipo_sensor_id,
                ts.nombre AS tipo_sensor_nombre,
                s.codigo,
                s.nombre,
                s.modelo,
                s.numero_serie,
                s.precision_valor,
                s.estado_sensor_id,
                es.nombre AS estado_sensor_nombre,
                s.fecha_instalacion
            FROM sensores s
            INNER JOIN dispositivos d ON d.id = s.dispositivo_id
            INNER JOIN tipos_sensor ts ON ts.id = s.tipo_sensor_id
            INNER JOIN estados_sensor es ON es.id = s.estado_sensor_id
            WHERE s.id = :id
        """),
        {"id": id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")
    return dict(row)


@router.put("/sensores/{id}", response_model=SensorResponse)
async def update_sensor(
    id: int,
    obj_in: SensorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = await crud.sensor.get(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")
    return await crud.sensor.update(db=db, db_obj=obj, obj_in=obj_in)


@router.post("/lecturas", response_model=LecturaSensorResponse, status_code=status.HTTP_201_CREATED)
async def create_lectura(
    obj_in: LecturaSensorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.lectura_sensor.create(db=db, obj_in=obj_in)


@router.get("/lecturas", response_model=list[LecturaSensorResponse])
async def read_lecturas(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.lectura_sensor.get_multi(db=db, skip=skip, limit=limit)


@router.post("/actuadores", response_model=ActuadorResponse, status_code=status.HTTP_201_CREATED)
async def create_actuador(
    obj_in: ActuadorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.actuador.create(db=db, obj_in=obj_in)


@router.get("/actuadores", response_model=list[ActuadorResponse])
async def read_actuadores(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        text("""
            SELECT
                a.id,
                a.dispositivo_id,
                d.nombre AS dispositivo_nombre,
                a.tipo_actuador_id,
                ta.nombre AS tipo_actuador_nombre,
                a.codigo,
                a.nombre,
                a.estado_actuador_id,
                ea.nombre AS estado_actuador_nombre,
                a.fecha_instalacion
            FROM actuadores a
            INNER JOIN dispositivos d ON d.id = a.dispositivo_id
            INNER JOIN tipos_actuador ta ON ta.id = a.tipo_actuador_id
            INNER JOIN estados_actuador ea ON ea.id = a.estado_actuador_id
            ORDER BY a.id
            OFFSET :skip
            LIMIT :limit
        """),
        {"skip": skip, "limit": limit},
    )
    rows = result.mappings().all()
    return [dict(row) for row in rows]


@router.get("/actuadores/{id}", response_model=ActuadorResponse)
async def read_actuador(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        text("""
            SELECT
                a.id,
                a.dispositivo_id,
                d.nombre AS dispositivo_nombre,
                a.tipo_actuador_id,
                ta.nombre AS tipo_actuador_nombre,
                a.codigo,
                a.nombre,
                a.estado_actuador_id,
                ea.nombre AS estado_actuador_nombre,
                a.fecha_instalacion
            FROM actuadores a
            INNER JOIN dispositivos d ON d.id = a.dispositivo_id
            INNER JOIN tipos_actuador ta ON ta.id = a.tipo_actuador_id
            INNER JOIN estados_actuador ea ON ea.id = a.estado_actuador_id
            WHERE a.id = :id
        """),
        {"id": id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Actuador no encontrado")
    return dict(row)


@router.get("/{id}", response_model=DispositivoResponse)
async def read_dispositivo(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        text("""
            SELECT
                d.id,
                d.tipo_dispositivo_id,
                td.nombre AS tipo_dispositivo_nombre,
                d.codigo,
                d.nombre,
                d.identificador_local,
                d.ip_local,
                d.version_firmware,
                d.estado_dispositivo_id,
                ed.nombre AS estado_dispositivo_nombre,
                d.ultima_conexion,
                d.creado_en
            FROM dispositivos d
            INNER JOIN tipos_dispositivo td ON td.id = d.tipo_dispositivo_id
            INNER JOIN estados_dispositivo ed ON ed.id = d.estado_dispositivo_id
            WHERE d.id = :id
        """),
        {"id": id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    return dict(row)


@router.put("/{id}", response_model=DispositivoResponse)
async def update_dispositivo(
    id: int,
    obj_in: DispositivoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = await crud.dispositivo.get(db=db, id=id)
    if not obj:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    update_data = obj_in.model_dump(exclude_unset=True)

    if update_data.get("ip_local") is not None:
        update_data["ip_local"] = str(update_data["ip_local"])

    await crud.dispositivo.update(db=db, db_obj=obj, obj_in=update_data)

    result = await db.execute(
        text("""
            SELECT
                d.id,
                d.tipo_dispositivo_id,
                td.nombre AS tipo_dispositivo_nombre,
                d.codigo,
                d.nombre,
                d.identificador_local,
                d.ip_local,
                d.version_firmware,
                d.estado_dispositivo_id,
                ed.nombre AS estado_dispositivo_nombre,
                d.ultima_conexion,
                d.creado_en
            FROM dispositivos d
            INNER JOIN tipos_dispositivo td ON td.id = d.tipo_dispositivo_id
            INNER JOIN estados_dispositivo ed ON ed.id = d.estado_dispositivo_id
            WHERE d.id = :id
        """),
        {"id": id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    return dict(row)