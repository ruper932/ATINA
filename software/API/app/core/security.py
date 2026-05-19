from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import pyotp
from jose import jwt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(
    subject: str | Any,
    is_partial: bool = False,
    extra_claims: dict | None = None,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=15 if is_partial else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode: dict[str, Any] = {
        "exp": expire,
        "sub": str(subject),
        "type": "partial" if is_partial else "access",
    }

    if extra_claims:
        to_encode.update(extra_claims)

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str) -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name="Atina App")


def verify_totp(secret: str, code: str) -> bool:
    return pyotp.TOTP(secret).verify(code)