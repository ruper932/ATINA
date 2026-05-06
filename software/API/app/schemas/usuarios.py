# app/schemas/usuarios.py
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

# === ROLES ===
class RolBase(BaseModel):
    nombre: str = Field(..., max_length=50)
    descripcion: str | None = None

class RolCreate(RolBase): pass

class RolUpdate(RolBase):
    nombre: str | None = None

class RolResponse(RolBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# === ESTADOS DE USUARIO ===
class EstadoUsuarioBase(BaseModel):
    nombre: str = Field(..., max_length=30)
    descripcion: str | None = None

class EstadoUsuarioCreate(EstadoUsuarioBase): pass

class EstadoUsuarioUpdate(EstadoUsuarioBase):
    nombre: str | None = None

class EstadoUsuarioResponse(EstadoUsuarioBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# === USUARIOS ===
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., max_length=100)
    is_active: bool = True
    is_superuser: bool = False
    rol_id: int | None = None
    estado_usuario_id: int | None = None
    is_totp_enabled: bool = False
    is_email_2fa_enabled: bool = False

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(UserBase):
    email: EmailStr | None = None
    username: str | None = None
    password: str | None = Field(None, min_length=8)
    is_active: bool | None = None
    is_superuser: bool | None = None
    rol_id: int | None = None
    estado_usuario_id: int | None = None
    is_totp_enabled: bool | None = None
    is_email_2fa_enabled: bool | None = None

class UserResponse(UserBase):
    id: int
    ultimo_acceso: datetime | None = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)