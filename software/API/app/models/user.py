from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class User(Base):
    __tablename__ = "users"

    ci: Mapped[str] = mapped_column(String(20), primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    rol_id: Mapped[int | None] = mapped_column(
        ForeignKey("roles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    estado_usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("estados_usuario.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    rol: Mapped["Rol | None"] = relationship("Rol", lazy="selectin")
    estado_usuario: Mapped["EstadoUsuario | None"] = relationship("EstadoUsuario", lazy="selectin")

    ultimo_acceso: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    totp_secret: Mapped[str | None] = mapped_column(String(32), nullable=True)
    is_totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    is_email_2fa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_code: Mapped[str | None] = mapped_column(String(6), nullable=True)
    email_code_expires: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    failed_login_attempts: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )