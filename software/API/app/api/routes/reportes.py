# app/api/routes/reportes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.db import get_db
from app.crud import crud_reportes as crud
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.reportes import (
    SincronizacionMCPCreate, SincronizacionMCPUpdate, SincronizacionMCPResponse,
    ReporteSemanalCreate, ReporteSemanalResponse,
    VReporteLecturasSensorResponse, VReporteAlertasInvernaderoResponse,
    VReporteInventarioDispositivosResponse, VReporteRiegoEjecutadoResponse,
    VReportePrediccionesAguaResponse
)

# Importar los modelos de las vistas
from app.models.reportes import (
    VistaReporteLecturasSensor, VistaReporteAlertasInvernadero,
    VistaReporteInventarioDispositivos, VistaReporteRiegoEjecutado,
    VistaReportePrediccionesAgua
)

router = APIRouter()

# --- SINCRONIZACIÓN MCP ---
@router.post("/sincronizaciones", response_model=SincronizacionMCPResponse, status_code=status.HTTP_201_CREATED)
async def create_sincronizacion(obj_in: SincronizacionMCPCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.sincronizacion_mcp.create(db=db, obj_in=obj_in)

@router.put("/sincronizaciones/{id}", response_model=SincronizacionMCPResponse)
async def update_sincronizacion(id: int, obj_in: SincronizacionMCPUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = await crud.sincronizacion_mcp.get(db=db, id=id)
    if not obj: raise HTTPException(status_code=404, detail="Sincronización no encontrada")
    return await crud.sincronizacion_mcp.update(db=db, db_obj=obj, obj_in=obj_in)

@router.get("/sincronizaciones", response_model=list[SincronizacionMCPResponse])
async def read_sincronizaciones(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.sincronizacion_mcp.get_multi(db=db, skip=skip, limit=limit)

# --- REPORTES SEMANALES ---
@router.post("/", response_model=ReporteSemanalResponse, status_code=status.HTTP_201_CREATED)
async def create_reporte(obj_in: ReporteSemanalCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj_in_data = obj_in.model_dump()
    obj_in_data["generado_por"] = current_user.id
    
    from app.models.reportes import ReporteSemanal
    db_obj = ReporteSemanal(**obj_in_data)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=list[ReporteSemanalResponse])
async def read_reportes(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud.reporte_semanal.get_multi(db=db, skip=skip, limit=limit)


# ========================================================
# REPORTES DE VISTAS (Solo GET)
# ========================================================

@router.get("/vistas/lecturas-sensor", response_model=list[VReporteLecturasSensorResponse])
async def get_reporte_lecturas_sensor(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VistaReporteLecturasSensor).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/vistas/alertas-invernadero", response_model=list[VReporteAlertasInvernaderoResponse])
async def get_reporte_alertas_invernadero(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VistaReporteAlertasInvernadero).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/vistas/inventario-dispositivos", response_model=list[VReporteInventarioDispositivosResponse])
async def get_reporte_inventario_dispositivos(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VistaReporteInventarioDispositivos).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/vistas/riego-ejecutado", response_model=list[VReporteRiegoEjecutadoResponse])
async def get_reporte_riego_ejecutado(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VistaReporteRiegoEjecutado).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/vistas/predicciones-agua", response_model=list[VReportePrediccionesAguaResponse])
async def get_reporte_predicciones_agua(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VistaReportePrediccionesAgua).offset(skip).limit(limit))
    return result.scalars().all()