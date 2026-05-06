# app/api/routes/health.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.db import get_db

router = APIRouter()

@router.get("/", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Verifica que la API esté corriendo. 
    No requiere conexión a base de datos.
    """
    return {"status": "ok", "message": "API ATINA en línea"}

@router.get("/db", status_code=status.HTTP_200_OK)
async def health_check_db(db: AsyncSession = Depends(get_db)):
    """
    Verifica que la conexión a la base de datos esté funcionando.
    """
    try:
        # Ejecutamos una consulta ultra ligera para probar la conexión
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "message": "Conexión a Base de Datos exitosa"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Fallo en conexión a Base de Datos: {str(e)}"
        )