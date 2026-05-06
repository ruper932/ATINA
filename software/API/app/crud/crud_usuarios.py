# app/crud/crud_usuarios.py
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.crud.base import CRUDBase
from app.models.user import User
from app.models.catalogos import Rol, EstadoUsuario
from app.schemas.usuarios import (
    UserCreate, UserUpdate, 
    RolCreate, RolUpdate, 
    EstadoUsuarioCreate, EstadoUsuarioUpdate
)
from app.core.security import get_password_hash

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        obj_in_data = obj_in.model_dump()
        # Extraer y hashear el password
        password = obj_in_data.pop("password")
        hashed_password = get_password_hash(password)
        
        db_obj = User(**obj_in_data, hashed_password=hashed_password)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, *, db_obj: User, obj_in: UserUpdate | dict[str, Any]) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
            
        # Si envían un password nuevo, lo hasheamos antes de guardar
        if "password" in update_data:
            hashed_password = get_password_hash(update_data.pop("password"))
            update_data["hashed_password"] = hashed_password
            
        return await super().update(db, db_obj=db_obj, obj_in=update_data)

class CRUDRol(CRUDBase[Rol, RolCreate, RolUpdate]): pass
class CRUDEstadoUsuario(CRUDBase[EstadoUsuario, EstadoUsuarioCreate, EstadoUsuarioUpdate]): pass

user = CRUDUser(User)
rol = CRUDRol(Rol)
estado_usuario = CRUDEstadoUsuario(EstadoUsuario)