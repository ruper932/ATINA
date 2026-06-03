import hashlib
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from PIL import Image, UnidentifiedImageError
from sqlalchemy import select, or_, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core import security
from app.core.db import get_db
from app.core.rate_limit import limiter
from app.models.catalogos import Rol
from app.models.perfil import Perfil
from app.models.trusted_device import TrustedDevice
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
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024

DUMMY_PASSWORD_HASH = security.get_password_hash("dummy_password_to_prevent_timing_attacks")
TRUSTED_DEVICE_COOKIE_NAME = "trusted_device_token"
TRUSTED_DEVICE_DURATION_DAYS = 30

COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax").lower()


async def send_2fa_email(email: str, code: str):
    print(f"📧 SIMULACIÓN: Enviando código {code} al correo {email}")


async def get_role_name(db: AsyncSession, rol_id: int | None) -> str:
    if not rol_id:
        return "invitado"

    role = await db.get(Rol, rol_id)
    if not role or not role.nombre:
        return "invitado"

    aliases = {
        "administrador": "admin",
        "admin": "admin",
        "docente": "docente",
        "técnico": "tecnico",
        "tecnico": "tecnico",
        "estudiante": "estudiante",
        "superadmin": "admin",
    }
    return aliases.get(role.nombre.strip().lower(), "invitado")


def build_profile_response(user: User) -> PerfilResponse:
    perfil = getattr(user, "perfil", None)

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
        nombres=perfil.nombres if perfil else None,
        apellido_paterno=perfil.apellido_paterno if perfil else None,
        apellido_materno=perfil.apellido_materno if perfil else None,
        telefono=perfil.telefono if perfil else None,
        cargo=perfil.cargo if perfil else None,
        foto_url=perfil.foto_url if perfil else None,
        bio=perfil.bio if perfil else None,
    )


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_username(username: str) -> str:
    return username.strip()


def normalize_ci(ci: str) -> str:
    return ci.strip()


def validate_password_strength(password: str):
    password = password.strip()

    if not password:
        raise HTTPException(status_code=400, detail="La contraseña es obligatoria.")

    if len(password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres.")

    if len(password) > 128:
        raise HTTPException(status_code=400, detail="La contraseña no puede tener más de 128 caracteres.")

    if not re.search(r"[A-Za-z]", password):
        raise HTTPException(status_code=400, detail="La contraseña debe incluir al menos una letra.")

    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="La contraseña debe incluir al menos un número.")


def validate_email_format(email: str):
    if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email):
        raise HTTPException(status_code=400, detail="Formato de correo electrónico inválido.")


def validate_totp_code(code: str) -> str:
    normalized_code = code.strip()
    if not re.fullmatch(r"\d{6}", normalized_code):
        raise HTTPException(status_code=400, detail="El código TOTP debe tener exactamente 6 dígitos.")
    return normalized_code


def validate_image_content(contents: bytes):
    try:
        image = Image.open(BytesIO(contents))
        image.verify()
    except (UnidentifiedImageError, OSError, SyntaxError):
        raise HTTPException(status_code=400, detail="El archivo subido no es una imagen válida.")


def get_client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
@limiter.limit("5/minute")
async def register(
    request: Request,
    ci: str = Form(..., min_length=4, max_length=20, pattern=r"^[0-9]+[A-Za-z0-9-]*$"),
    username: str = Form(..., min_length=3, max_length=100, pattern=r"^[\w.-]+$"),
    email: str = Form(...),
    password: str = Form(...),
    nombres: str = Form(..., min_length=2, max_length=100),
    apellido_paterno: str = Form(..., min_length=2, max_length=100),
    apellido_materno: str | None = Form(None, max_length=100),
    telefono: str | None = Form(None, pattern=r"^\+?[0-9]{7,15}$"),
    bio: str | None = Form(None, max_length=500),
    foto: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
):
    normalized_ci = normalize_ci(ci)
    normalized_username = normalize_username(username)
    normalized_email = normalize_email(email)

    validate_email_format(normalized_email)
    validate_password_strength(password)

    if not normalized_ci:
        raise HTTPException(status_code=400, detail="El CI es obligatorio.")

    if not normalized_username:
        raise HTTPException(status_code=400, detail="El nombre de usuario es obligatorio.")

    if not normalized_email:
        raise HTTPException(status_code=400, detail="El correo electrónico es obligatorio.")

    if not nombres.strip():
        raise HTTPException(status_code=400, detail="El campo nombres es obligatorio.")

    if not apellido_paterno.strip():
        raise HTTPException(status_code=400, detail="El campo apellido paterno es obligatorio.")

    if apellido_materno is not None and not apellido_materno.strip():
        apellido_materno = None

    if telefono is not None and not telefono.strip():
        telefono = None

    if bio is not None and not bio.strip():
        bio = None

    existing_ci = await db.execute(select(User).where(User.ci == normalized_ci))
    if existing_ci.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El CI ya se encuentra registrado.")

    existing_email = await db.execute(select(User).where(User.email == normalized_email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El correo electrónico ya se encuentra registrado.")

    existing_username = await db.execute(select(User).where(User.username == normalized_username))
    if existing_username.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya se encuentra registrado.")

    foto_url = None
    file_path = None

    if foto:
        if not foto.filename:
            raise HTTPException(status_code=400, detail="El archivo de imagen no tiene un nombre válido.")

        if foto.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Formato de imagen no permitido. Solo se aceptan JPG, JPEG, PNG o WEBP.",
            )

        ext = Path(foto.filename).suffix.lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail="Extensión de archivo no permitida. Solo se aceptan .jpg, .jpeg, .png o .webp.",
            )

        try:
            contents = await foto.read()
        except Exception:
            raise HTTPException(status_code=400, detail="No se pudo leer el archivo de imagen enviado.")

        if not contents:
            raise HTTPException(status_code=400, detail="La imagen enviada está vacía.")

        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail="La imagen no debe superar los 5 MB.")

        validate_image_content(contents)

        try:
            filename = f"{uuid.uuid4().hex}{ext}"
            file_path = UPLOAD_DIR / filename
            with open(file_path, "wb") as buffer:
                buffer.write(contents)
            foto_url = f"/uploads/profile_photos/{filename}"
        except Exception:
            if file_path and file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=500, detail="Ocurrió un error al guardar la imagen de perfil.")

    try:
        new_user = User(
            ci=normalized_ci,
            email=normalized_email,
            username=normalized_username,
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
            apellido_materno=apellido_materno.strip() if apellido_materno else None,
            telefono=telefono.strip() if telefono else None,
            cargo="Invitado",
            foto_url=foto_url,
            bio=bio.strip() if bio else None,
        )
        db.add(new_perfil)

        await db.commit()
        return MessageResponse(message="Usuario registrado exitosamente")

    except IntegrityError:
        await db.rollback()

        if file_path and file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=400,
            detail="No se pudo registrar el usuario porque ya existe un CI, correo o nombre de usuario registrado.",
        )

    except HTTPException:
        await db.rollback()

        if file_path and file_path.exists():
            file_path.unlink()

        raise

    except Exception:
        await db.rollback()

        if file_path and file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Ocurrió un error interno al registrar el usuario.",
        )


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    login_value = form_data.username.strip()
    login_email = login_value.lower()

    query = select(User).where(
        or_(User.email == login_email, User.username == login_value)
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)

    hash_to_verify = user.hashed_password if user else DUMMY_PASSWORD_HASH
    is_password_correct = security.verify_password(form_data.password, hash_to_verify)

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales incorrectas",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not user or not is_password_correct:
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 3:
                user.locked_until = now + timedelta(minutes=2)
                user.failed_login_attempts = 0
            await db.commit()
        raise credentials_exception

    if user.locked_until and user.locked_until > now:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Cuenta bloqueada temporalmente. Intenta de nuevo más tarde.",
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    trusted_cookie = request.cookies.get(TRUSTED_DEVICE_COOKIE_NAME)
    skip_2fa = False

    if trusted_cookie and user.is_totp_enabled:
        token_hash = hashlib.sha256(trusted_cookie.encode()).hexdigest()

        await db.execute(
            delete(TrustedDevice).where(
                TrustedDevice.user_ci == user.ci,
                TrustedDevice.expires_at <= now,
            )
        )

        td_query = select(TrustedDevice).where(
            TrustedDevice.token_hash == token_hash,
            TrustedDevice.user_ci == user.ci,
            TrustedDevice.expires_at > now,
        )
        td_result = await db.execute(td_query)
        trusted_device = td_result.scalar_one_or_none()

        if trusted_device:
            skip_2fa = True
            trusted_device.last_used_at = now
            trusted_device.ip_address = get_client_ip(request)

    if user.is_totp_enabled and not skip_2fa:
        await db.commit()

        temp_token = security.create_access_token(
            user.ci,
            is_partial=True,
            extra_claims={"role": await get_role_name(db, user.rol_id)},
        )

        return LoginResponse(
            requires_2fa=True,
            temp_token=temp_token,
            method="totp",
            message="Requiere verificación 2FA.",
        )

    user.failed_login_attempts = 0
    user.locked_until = None
    user.ultimo_acceso = now
    await db.commit()

    role_name = await get_role_name(db, user.rol_id)
    access_token = security.create_access_token(user.ci, extra_claims={"role": role_name})
    return LoginResponse(access_token=access_token, token_type="bearer")


@router.post("/login/verify-2fa", response_model=LoginResponse)
@limiter.limit("5/minute")
async def verify_2fa(
    request: Request,
    response: Response,
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
        raise HTTPException(status_code=401, detail="Token temporal inválido o expirado")

    user = await db.get(User, user_ci)
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="Usuario no encontrado o inactivo")

    if req.method != "totp":
        raise HTTPException(status_code=400, detail="Método 2FA no soportado actualmente")

    if not user.is_totp_enabled or not user.totp_secret:
        raise HTTPException(status_code=400, detail="TOTP no está habilitado para este usuario")

    now = datetime.now(timezone.utc)
    normalized_code = validate_totp_code(req.code)
    is_valid = security.verify_totp(user.totp_secret, normalized_code)

    if not is_valid:
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 3:
            user.locked_until = now + timedelta(minutes=2)
            user.failed_login_attempts = 0
        await db.commit()
        raise HTTPException(status_code=401, detail="Código 2FA incorrecto o expirado")

    user.failed_login_attempts = 0
    user.locked_until = None
    user.ultimo_acceso = now

    if req.trust_device:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        await db.execute(
            delete(TrustedDevice).where(
                TrustedDevice.user_ci == user.ci,
                TrustedDevice.expires_at <= now,
            )
        )

        new_device = TrustedDevice(
            user_ci=user.ci,
            token_hash=token_hash,
            user_agent=(request.headers.get("user-agent") or "Unknown")[:255],
            ip_address=get_client_ip(request),
            expires_at=now + timedelta(days=TRUSTED_DEVICE_DURATION_DAYS),
            last_used_at=now,
        )
        db.add(new_device)

        response.set_cookie(
            key=TRUSTED_DEVICE_COOKIE_NAME,
            value=raw_token,
            max_age=TRUSTED_DEVICE_DURATION_DAYS * 24 * 60 * 60,
            expires=TRUSTED_DEVICE_DURATION_DAYS * 24 * 60 * 60,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            path="/",
        )

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
    if current_user.is_totp_enabled:
        raise HTTPException(status_code=400, detail="TOTP ya está configurado y activo.")

    secret = security.generate_totp_secret()
    current_user.totp_secret = secret
    await db.commit()

    uri = security.get_totp_uri(secret, current_user.email)
    return SetupTOTPResponse(secret=secret, uri=uri)


@router.post("/2fa/enable-totp", response_model=MessageResponse)
@limiter.limit("5/minute")
async def enable_totp(
    request: Request,
    code: str = Form(..., min_length=6, max_length=6),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Primero debes configurar TOTP")
    if current_user.is_totp_enabled:
        raise HTTPException(status_code=400, detail="TOTP ya se encuentra activo")

    normalized_code = validate_totp_code(code)

    if not security.verify_totp(current_user.totp_secret, normalized_code):
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

    normalized_code = validate_totp_code(payload.code)

    if not security.verify_totp(current_user.totp_secret, normalized_code):
        raise HTTPException(status_code=400, detail="Código TOTP incorrecto")

    current_user.is_totp_enabled = False
    current_user.totp_secret = None

    await db.execute(delete(TrustedDevice).where(TrustedDevice.user_ci == current_user.ci))
    await db.commit()

    return MessageResponse(message="TOTP desactivado correctamente y dispositivos de confianza revocados")


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    response.delete_cookie(
        key=TRUSTED_DEVICE_COOKIE_NAME,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/",
    )
    return MessageResponse(message="Sesión cerrada.")


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
            selectinload(User.perfil),
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
    normalized_email = normalize_email(payload.email)
    normalized_username = normalize_username(payload.username)

    validate_email_format(normalized_email)

    if not security.verify_password(payload.password_actual, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    query = select(User).where(
        or_(User.email == normalized_email, User.username == normalized_username),
        User.ci != current_user.ci,
    )
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if existing_user.email == normalized_email:
            raise HTTPException(status_code=400, detail="El email ya está en uso")
        if existing_user.username == normalized_username:
            raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")

    current_user.email = normalized_email
    current_user.username = normalized_username

    await db.commit()

    query_updated = (
        select(User)
        .options(
            selectinload(User.rol),
            selectinload(User.estado_usuario),
            selectinload(User.perfil),
        )
        .where(User.ci == current_user.ci)
    )
    result_updated = await db.execute(query_updated)
    updated_user = result_updated.scalar_one()

    return build_profile_response(updated_user)


@router.put("/me/password", response_model=MessageResponse)
async def update_my_password(
    payload: PerfilPasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not security.verify_password(payload.password_actual, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    if payload.password_actual == payload.password_nueva:
        raise HTTPException(status_code=400, detail="La nueva contraseña no puede ser igual a la actual")

    validate_password_strength(payload.password_nueva)

    current_user.hashed_password = security.get_password_hash(payload.password_nueva)

    await db.execute(delete(TrustedDevice).where(TrustedDevice.user_ci == current_user.ci))
    await db.commit()

    return MessageResponse(message="Contraseña actualizada correctamente. Dispositivos de confianza revocados.")