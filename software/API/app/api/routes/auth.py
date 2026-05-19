import random
import string
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core import security
from app.core.db import get_db
from app.core.rate_limit import limiter
from app.models.catalogos import Rol
from app.models.perfil import Perfil
from app.models.user import User
from app.schemas.auth import (
    DisableTOTPRequest,
    LoginResponse,
    MessageResponse,
    PerfilPasswordUpdate,
    PerfilResponse,
    PerfilUpdate,
    RefreshTokenRequest,
    SetupTOTPResponse,
    Verify2FARequest,
)

router = APIRouter()

UPLOAD_DIR = Path("uploads/profile_photos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024


async def send_2fa_email(email: str, code: str):
    print(f"📧 SIMULACIÓN: Enviando código {code} al correo {email}")


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
        "superadmin": "superadmin",
    }
    return aliases.get(normalized, "invitado")


def build_profile_response(user: User) -> PerfilResponse:
    return PerfilResponse(
        ci=user.ci,
        email=user.email,
        username=user.username,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        rol_id=user.rol_id,
        rol_nombre=user.rol.nombre if getattr(user, "rol", None) else None,
        estado_usuario_id=user.estado_usuario_id,
        estado_usuario_nombre=user.estado_usuario.nombre if getattr(user, "estado_usuario", None) else None,
        ultimo_acceso=user.ultimo_acceso,
        created_at=user.created_at,
        updated_at=user.updated_at,
        is_totp_enabled=user.is_totp_enabled,
        is_email_2fa_enabled=user.is_email_2fa_enabled,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
@limiter.limit("5/minute")
async def register(
    request: Request,
    ci: str = Form(...),
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    nombres: str = Form(...),
    apellido_paterno: str = Form(...),
    apellido_materno: str | None = Form(None),
    telefono: str | None = Form(None),
    bio: str | None = Form(None),
    foto: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(
        or_(User.email == email.strip(), User.username == username.strip(), User.ci == ci.strip())
    )
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El CI, email o usuario ya existe")

    foto_url = None
    file_path = None

    if foto:
        if foto.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Formato de imagen no permitido. Usa JPG, PNG o WEBP.",
            )

        contents = await foto.read()
        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail="La imagen no debe superar los 5 MB.")

        extension = Path(foto.filename).suffix.lower() if foto.filename else ".jpg"
        filename = f"{uuid.uuid4().hex}{extension}"
        file_path = UPLOAD_DIR / filename

        with open(file_path, "wb") as buffer:
            buffer.write(contents)

        foto_url = f"/uploads/profile_photos/{filename}"

    try:
        new_user = User(
            ci=ci.strip(),
            email=email.strip(),
            username=username.strip(),
            hashed_password=security.get_password_hash(password),
            rol_id=5,
            estado_usuario_id=1,
        )
        db.add(new_user)
        await db.flush()

        new_perfil = Perfil(
            user_ci=new_user.ci,
            nombres=nombres.strip(),
            apellido_paterno=apellido_paterno.strip(),
            apellido_materno=apellido_materno.strip() if apellido_materno and apellido_materno.strip() else None,
            telefono=telefono.strip() if telefono and telefono.strip() else None,
            cargo="Invitado",
            foto_url=foto_url,
            bio=bio.strip() if bio and bio.strip() else None,
        )
        db.add(new_perfil)

        await db.commit()
        return MessageResponse(message="Usuario registrado exitosamente")
    except Exception:
        await db.rollback()
        if file_path and file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail="Ocurrió un error al registrar el usuario")


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    query = select(User).where(
        or_(User.email == form_data.username, User.username == form_data.username)
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales incorrectas",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not user:
        raise credentials_exception

    now = datetime.now(timezone.utc)

    if user.locked_until and user.locked_until > now:
        remaining_seconds = int((user.locked_until - now).total_seconds())
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Cuenta bloqueada temporalmente. Intenta de nuevo en {remaining_seconds} segundos.",
        )

    if not security.verify_password(form_data.password, user.hashed_password):
        user.failed_login_attempts += 1

        if user.failed_login_attempts >= 3:
            user.locked_until = now + timedelta(minutes=2)
            user.failed_login_attempts = 0
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Cuenta bloqueada temporalmente por 2 minutos debido a múltiples intentos fallidos.",
            )

        await db.commit()
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")

    user.failed_login_attempts = 0
    user.locked_until = None

    role_name = await get_role_name(db, user.rol_id)

    if user.is_totp_enabled or user.is_email_2fa_enabled:
        temp_token = security.create_access_token(
            user.ci,
            is_partial=True,
            extra_claims={"role": role_name},
        )

        method = "totp"

        if user.is_email_2fa_enabled:
            code = "".join(random.choices(string.digits, k=6))
            user.email_code = code
            user.email_code_expires = now + timedelta(minutes=10)
            method = "email"

        await db.commit()

        if user.is_email_2fa_enabled:
            await send_2fa_email(user.email, code)

        return LoginResponse(
            requires_2fa=True,
            temp_token=temp_token,
            method=method,
            message="Requiere verificación 2FA.",
        )

    user.ultimo_acceso = now
    await db.commit()

    access_token = security.create_access_token(
        user.ci,
        extra_claims={"role": role_name},
    )
    return LoginResponse(access_token=access_token, token_type="bearer")


@router.post("/login/verify-2fa", response_model=LoginResponse)
@limiter.limit("5/minute")
async def verify_2fa(
    request: Request,
    req: Verify2FARequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = security.verify_token(req.temp_token)
        if payload.get("type") != "partial":
            raise ValueError()
        user_ci = payload.get("sub")
        if not user_ci:
            raise ValueError()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token temporal inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await db.get(User, user_ci)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    is_valid = False

    if req.method == "totp" and user.is_totp_enabled and user.totp_secret:
        is_valid = security.verify_totp(user.totp_secret, req.code)
    elif req.method == "email" and user.is_email_2fa_enabled:
        if user.email_code and user.email_code_expires:
            if user.email_code == req.code and user.email_code_expires > datetime.now(timezone.utc):
                is_valid = True
                user.email_code = None
                user.email_code_expires = None

    if not is_valid:
        raise HTTPException(status_code=401, detail="Código 2FA incorrecto o expirado")

    user.failed_login_attempts = 0
    user.locked_until = None
    user.ultimo_acceso = datetime.now(timezone.utc)
    await db.commit()

    role_name = await get_role_name(db, user.rol_id)
    access_token = security.create_access_token(user.ci, extra_claims={"role": role_name})

    return LoginResponse(access_token=access_token, token_type="bearer")


@router.post("/refresh", response_model=LoginResponse)
@limiter.limit("10/minute")
async def refresh_token(
    request: Request,
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        decoded = security.verify_token(payload.token)
        if decoded.get("type") != "access":
            raise ValueError()
        user_ci = decoded.get("sub")
        if not user_ci:
            raise ValueError()
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    user = await db.get(User, user_ci)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario inválido o inactivo")

    role_name = await get_role_name(db, user.rol_id)
    new_token = security.create_access_token(user.ci, extra_claims={"role": role_name})

    return LoginResponse(access_token=new_token, token_type="bearer")


@router.post("/2fa/setup-totp", response_model=SetupTOTPResponse)
@limiter.limit("5/minute")
async def setup_totp(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    secret = security.generate_totp_secret()
    current_user.totp_secret = secret
    current_user.is_totp_enabled = False
    await db.commit()

    uri = security.get_totp_uri(secret, current_user.email)
    return SetupTOTPResponse(secret=secret, uri=uri)


@router.post("/2fa/enable-totp", response_model=MessageResponse)
@limiter.limit("5/minute")
async def enable_totp(
    request: Request,
    code: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Primero debes configurar TOTP")

    if not security.verify_totp(current_user.totp_secret, code):
        raise HTTPException(status_code=400, detail="Código TOTP incorrecto")

    current_user.is_totp_enabled = True
    await db.commit()

    return MessageResponse(message="TOTP activado correctamente")


@router.post("/2fa/disable-totp", response_model=MessageResponse)
@limiter.limit("5/minute")
async def disable_totp(
    request: Request,
    payload: DisableTOTPRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.is_totp_enabled or not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="TOTP no está habilitado")

    if not security.verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    if not security.verify_totp(current_user.totp_secret, payload.code):
        raise HTTPException(status_code=400, detail="Código TOTP incorrecto")

    current_user.is_totp_enabled = False
    current_user.totp_secret = None
    await db.commit()

    return MessageResponse(message="TOTP desactivado correctamente")


@router.post("/logout", response_model=MessageResponse)
async def logout():
    return MessageResponse(message="Sesión cerrada. El cliente debe descartar el token.")


@router.get("/me", response_model=PerfilResponse)
async def get_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(User)
        .options(
            selectinload(User.rol),
            selectinload(User.estado_usuario),
        )
        .where(User.ci == current_user.ci)
    )

    result = await db.execute(query)
    user = result.scalar_one()

    return build_profile_response(user)

@router.put("/me", response_model=PerfilResponse)
async def update_me(
    payload: PerfilUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not security.verify_password(payload.password_actual, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    query = select(User).where(
        or_(User.email == payload.email.strip(), User.username == payload.username.strip()),
        User.ci != current_user.ci,
    )
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if existing_user.email == payload.email.strip():
            raise HTTPException(status_code=400, detail="El email ya está en uso")
        if existing_user.username == payload.username.strip():
            raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")

    current_user.email = payload.email.strip()
    current_user.username = payload.username.strip()

    await db.commit()
    await db.refresh(current_user)

    return build_profile_response(current_user)


@router.put("/me/password", response_model=MessageResponse)
async def update_my_password(
    payload: PerfilPasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not security.verify_password(payload.password_actual, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    if payload.password_actual == payload.password_nueva:
        raise HTTPException(
            status_code=400,
            detail="La nueva contraseña no puede ser igual a la actual",
        )

    current_user.hashed_password = security.get_password_hash(payload.password_nueva)
    await db.commit()

    return MessageResponse(message="Contraseña actualizada correctamente")