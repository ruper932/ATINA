# app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    nombres: str  # Del modelo SQL original
    apellidos: str # Del modelo SQL original
    password: str

class LoginRequest(BaseModel):
    email_or_username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str | None = None
    token_type: str | None = None
    requires_2fa: bool = False
    temp_token: str | None = None
    message: str | None = None

class Verify2FARequest(BaseModel):
    temp_token: str
    code: str
    method: str  # "totp" (Authy) o "email"

class SetupTOTPResponse(BaseModel):
    secret: str
    uri: str


class PerfilResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    is_active: bool
    is_superuser: bool
    rol_id: Optional[int] = None
    estado_usuario_id: Optional[int] = None
    is_totp_enabled: bool = False
    is_email_2fa_enabled: bool = False
    ultimo_acceso: Optional[str] = None

    class Config:
        from_attributes = True


class PerfilUpdate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)


class PerfilPasswordUpdate(BaseModel):
    password_actual: str = Field(..., min_length=8)
    password_nueva: str = Field(..., min_length=8)


class MessageResponse(BaseModel):
    message: str