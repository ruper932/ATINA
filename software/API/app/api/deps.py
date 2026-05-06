# app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError

from app.core import security
from app.core.config import settings
from app.core.db import get_db
from app.models.user import User

# Esto le dice a FastAPI (y a Swagger UI) de dónde viene el token.
# Apuntamos a la ruta de login para que Swagger pueda autenticarse.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Extrae el token JWT del header Authorization, lo valida,
    y devuelve el usuario de la base de datos.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodificamos el token usando nuestras utilidades
        payload = security.verify_token(token)
        
        # Validamos que no sea un token parcial de 2FA
        if payload.get("type") == "partial":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Este token es solo para verificación 2FA. Completa el login."
            )
            
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
    except (JWTError, ValidationError):
        raise credentials_exception

    # Buscamos el usuario en la BD
    user = await db.get(User, int(user_id))
    if not user:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Usuario inactivo"
        )
        
    return user


async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependencia adicional para endpoints que solo puedan ser usados por administradores.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="El usuario no tiene suficientes privilegios"
        )
    return current_user