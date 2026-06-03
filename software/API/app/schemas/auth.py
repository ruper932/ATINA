from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginResponse(BaseModel):
    access_token: str | None = None
    token_type: str | None = None
    requires_2fa: bool = False
    temp_token: str | None = None
    method: Literal["totp", "email"] | None = None
    message: str | None = None


class Verify2FARequest(BaseModel):
    temp_token: str
    code: str = Field(..., min_length=4, max_length=10)
    method: Literal["totp", "email"]
    trust_device: bool = False


class SetupTOTPResponse(BaseModel):
    secret: str
    uri: str


class DisableTOTPRequest(BaseModel):
    password: str = Field(..., min_length=8)
    code: str = Field(..., min_length=4, max_length=10)


class RefreshTokenRequest(BaseModel):
    token: str


class PerfilResponse(BaseModel):
    ci: str
    email: str
    username: str
    is_active: bool
    is_superuser: bool
    rol_id: int | None = None
    rol_nombre: str | None = None
    estado_usuario_id: int | None = None
    estado_usuario_nombre: str | None = None
    ultimo_acceso: datetime | None = None
    created_at: datetime
    updated_at: datetime
    is_totp_enabled: bool
    is_email_2fa_enabled: bool

    nombres: str | None = None
    apellido_paterno: str | None = None
    apellido_materno: str | None = None
    telefono: str | None = None
    cargo: str | None = None
    foto_url: str | None = None
    bio: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PerfilUpdate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password_actual: str = Field(..., min_length=8)


class PerfilPasswordUpdate(BaseModel):
    password_actual: str = Field(..., min_length=8)
    password_nueva: str = Field(..., min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str