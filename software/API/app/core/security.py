from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt
import bcrypt
import pyotp

SECRET_KEY = "super_secreto_super_seguro_cambiar_en_produccion"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")
    hash_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hash_bytes)


def get_password_hash(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed_password_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_password_bytes.decode("utf-8")


def create_access_token(
    subject: str | Any,
    is_partial: bool = False,
    extra_claims: dict | None = None
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=15 if is_partial else ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "partial" if is_partial else "access",
    }

    if extra_claims:
        to_encode.update(extra_claims)

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str) -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name="Atina App")


def verify_totp(secret: str, code: str) -> bool:
    return pyotp.TOTP(secret).verify(code)