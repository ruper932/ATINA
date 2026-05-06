# app/db/init_db.py
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.db import AsyncSessionLocal
from app.core.config import settings
from app.models.user import User
from app.crud.crud_usuarios import user as crud_user
from app.schemas.usuarios import UserCreate

async def init_db(db: AsyncSession) -> None:
    
    query = select(User).where(User.email == "admin@atina.com")
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        print("Creando el superusuario inicial...")
        
        user_in = UserCreate(
            email="admin@atina.com",
            username="superadmin",
            password="demons312es", 
            is_active=True,
            is_superuser=True,
            rol_id=1,              
            estado_usuario_id=1    
        )
        
        
        user = await crud_user.create(db, obj_in=user_in)
        print(f"✅ Superusuario creado exitosamente: {user.email}")
    else:
        print("ℹ️ El superusuario ya existe en la base de datos. Saltando paso.")

async def main() -> None:
    print("Iniciando conexión a la base de datos...")
    async with AsyncSessionLocal() as db:
        await init_db(db)
    print("Proceso de inicialización finalizado.")

if __name__ == "__main__":
    asyncio.run(main())