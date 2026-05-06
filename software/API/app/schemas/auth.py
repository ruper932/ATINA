# app/schemas/auth.py
from pydantic import BaseModel, EmailStr

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