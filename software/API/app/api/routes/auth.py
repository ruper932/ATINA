# app/api/routes/auth.py
import random
import string
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from app.models.catalogos import Rol

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core import security
from app.models.user import User
from app.models.perfil import Perfil
from app.schemas.auth import (
    LoginResponse,
    Verify2FARequest,
    SetupTOTPResponse
)

router = APIRouter()

UPLOAD_DIR = Path("uploads/profile_photos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


# Simulador de envío de correo
async def send_2fa_email(email: str, code: str):
    print(f"📧 SIMULACIÓN: Enviando código {code} al correo {email}")

def map_role_name(rol_id: int | None) -> str:
    role_map = {
        1: "superadmin",
        2: "admin",
        3: "tecnico",
        4: "docente",
        5: "invitado",
    }
    return role_map.get(rol_id, "invitado")


async def get_role_name(db: AsyncSession, rol_id: int | None) -> str:
    if not rol_id:
        return "invitado"

    role = await db.get(Rol, rol_id)
    if not role or not role.nombre:
        return "invitado"

    normalized = role.nombre.strip().lower()

    aliases = {
        "administrador": "admin",
        "admin": "admin",
        "docente": "docente",
        "técnico": "tecnico",
        "tecnico": "tecnico",
        "estudiante": "estudiante",
        "invitado": "invitado",
    }

    return aliases.get(normalized, "invitado")
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    nombres: str = Form(...),
    apellidos: str = Form(...),
    telefono: str | None = Form(None),
    bio: str | None = Form(None),
    foto: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(
        or_(User.email == email, User.username == username)
    )
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email o usuario ya existe")

    foto_url = None
    file_path = None

    if foto:
        if foto.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Formato de imagen no permitido. Usa JPG, PNG o WEBP."
            )

        contents = await foto.read()

        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="La imagen no debe superar los 5 MB."
            )

        extension = Path(foto.filename).suffix.lower() if foto.filename else ".jpg"
        filename = f"{uuid.uuid4().hex}{extension}"
        file_path = UPLOAD_DIR / filename

        with open(file_path, "wb") as buffer:
            buffer.write(contents)

        foto_url = f"/uploads/profile_photos/{filename}"

    try:
        new_user = User(
            email=email,
            username=username,
            hashed_password=security.get_password_hash(password),
            rol_id=5,
            estado_usuario_id=1,
        )
        db.add(new_user)
        await db.flush()

        new_perfil = Perfil(
            user_id=new_user.id,
            nombres=nombres.strip(),
            apellidos=apellidos.strip(),
            telefono=telefono.strip() if telefono and telefono.strip() else None,
            cargo="Invitado",
            foto_url=foto_url,
            bio=bio.strip() if bio and bio.strip() else None,
        )
        db.add(new_perfil)

        await db.commit()
        return {"message": "Usuario registrado exitosamente"}
    except Exception:
        await db.rollback()

        if file_path and file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Ocurrió un error al registrar el usuario"
        )


@router.post("/login", response_model=LoginResponse)
async def login(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    query = select(User).where(
        or_(User.email == form_data.username, User.username == form_data.username)
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")

    role_name = await get_role_name(db, user.rol_id)

    if user.is_totp_enabled or user.is_email_2fa_enabled:
        temp_token = security.create_access_token(
            user.id,
            is_partial=True,
            extra_claims={"role": role_name}
        )

        if user.is_email_2fa_enabled:
            code = ''.join(random.choices(string.digits, k=6))
            user.email_code = code
            user.email_code_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
            await db.commit()
            await send_2fa_email(user.email, code)

        return LoginResponse(
            requires_2fa=True,
            temp_token=temp_token,
            message="Requiere verificación 2FA."
        )

    user.ultimo_acceso = datetime.now(timezone.utc)
    await db.commit()

    access_token = security.create_access_token(
        user.id,
        extra_claims={"role": role_name}
    )
    return LoginResponse(access_token=access_token, token_type="bearer")
@router.post("/login/verify-2fa", response_model=LoginResponse)
async def verify_2fa(req: Verify2FARequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = security.verify_token(req.temp_token)
        if payload.get("type") != "partial":
            raise ValueError()
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Token temporal inválido o expirado")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    is_valid = False
    if req.method == "totp" and user.is_totp_enabled:
        is_valid = security.verify_totp(user.totp_secret, req.code)
    elif req.method == "email" and user.is_email_2fa_enabled:
        if user.email_code == req.code and user.email_code_expires > datetime.now(timezone.utc):
            is_valid = True
            user.email_code = None
            user.email_code_expires = None

    if not is_valid:
        raise HTTPException(status_code=401, detail="Código 2FA incorrecto o expirado")

    user.ultimo_acceso = datetime.now(timezone.utc)
    await db.commit()

    role_name = await get_role_name(db, user.rol_id)

    return LoginResponse(
        access_token=security.create_access_token(
            user.id,
            extra_claims={"role": role_name}
        ),
        token_type="bearer"
    )

@router.post("/2fa/setup-authy", response_model=SetupTOTPResponse)
async def setup_authy(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    secret = security.generate_totp_secret()

    user.totp_secret = secret
    await db.commit()

    uri = security.get_totp_uri(secret, user.email)
    return SetupTOTPResponse(secret=secret, uri=uri)


@router.post("/2fa/enable-authy")
async def enable_authy(user_id: int, code: str, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if security.verify_totp(user.totp_secret, code):
        user.is_totp_enabled = True
        await db.commit()
        return {"message": "Authy 2FA activado correctamente"}
    raise HTTPException(status_code=400, detail="Código incorrecto")


@router.post("/logout")
async def logout():
    return {"message": "Sesión cerrada. Por favor, elimina tu token en el cliente."}