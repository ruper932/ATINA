"""seed_multiple_users

Revision ID: e608a0860c6c
Revises: eed2c483d130
Create Date: 2026-05-07 21:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'e608a0860c6c'
down_revision: Union[str, Sequence[str], None] = 'eed2c483d130'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Insertar usuarios si no existen
    op.execute("""
        INSERT INTO users (ci, username, email, hashed_password, is_active, is_superuser, rol_id, estado_usuario_id, is_totp_enabled, is_email_2fa_enabled)
        SELECT '1000001', 'admin_cea', 'admin@cea.edu', '$2b$12$fakehash1', true, true, (SELECT id FROM roles WHERE nombre='admin'), (SELECT id FROM estados_usuario WHERE nombre='activo'), false, false
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='admin_cea');
    """)
    op.execute("""
        INSERT INTO users (ci, username, email, hashed_password, is_active, is_superuser, rol_id, estado_usuario_id, is_totp_enabled, is_email_2fa_enabled)
        SELECT '1000002', 'tecnico_luis', 'tecnico@cea.edu', '$2b$12$fakehash2', true, false, (SELECT id FROM roles WHERE nombre='tecnico'), (SELECT id FROM estados_usuario WHERE nombre='activo'), false, false
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='tecnico_luis');
    """)
    op.execute("""
        INSERT INTO users (ci, username, email, hashed_password, is_active, is_superuser, rol_id, estado_usuario_id, is_totp_enabled, is_email_2fa_enabled)
        SELECT '1000003', 'tecnico_maria', 'maria@cea.edu', '$2b$12$fakehash3', true, false, (SELECT id FROM roles WHERE nombre='tecnico'), (SELECT id FROM estados_usuario WHERE nombre='activo'), false, false
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='tecnico_maria');
    """)
    op.execute("""
        INSERT INTO users (ci, username, email, hashed_password, is_active, is_superuser, rol_id, estado_usuario_id, is_totp_enabled, is_email_2fa_enabled)
        SELECT '1000004', 'tecnico_juan', 'juan@cea.edu', '$2b$12$fakehash4', true, false, (SELECT id FROM roles WHERE nombre='tecnico'), (SELECT id FROM estados_usuario WHERE nombre='activo'), false, false
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='tecnico_juan');
    """)
    op.execute("""
        INSERT INTO users (ci, username, email, hashed_password, is_active, is_superuser, rol_id, estado_usuario_id, is_totp_enabled, is_email_2fa_enabled)
        SELECT '1000005', 'docente_juana', 'juana@cea.edu', '$2b$12$fakehash5', true, false, (SELECT id FROM roles WHERE nombre='docente'), (SELECT id FROM estados_usuario WHERE nombre='activo'), false, false
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='docente_juana');
    """)
    op.execute("""
        INSERT INTO users (ci, username, email, hashed_password, is_active, is_superuser, rol_id, estado_usuario_id, is_totp_enabled, is_email_2fa_enabled)
        SELECT '1000006', 'docente_pedro', 'pedro@cea.edu', '$2b$12$fakehash6', true, false, (SELECT id FROM roles WHERE nombre='docente'), (SELECT id FROM estados_usuario WHERE nombre='activo'), false, false
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='docente_pedro');
    """)
    op.execute("""
        INSERT INTO users (ci, username, email, hashed_password, is_active, is_superuser, rol_id, estado_usuario_id, is_totp_enabled, is_email_2fa_enabled)
        SELECT '1000007', 'estudiante_carlos', 'carlos@cea.edu', '$2b$12$fakehash7', true, false, (SELECT id FROM roles WHERE nombre='estudiante'), (SELECT id FROM estados_usuario WHERE nombre='activo'), false, false
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='estudiante_carlos');
    """)
    op.execute("""
        INSERT INTO users (ci, username, email, hashed_password, is_active, is_superuser, rol_id, estado_usuario_id, is_totp_enabled, is_email_2fa_enabled)
        SELECT '1000008', 'estudiante_ana', 'ana@cea.edu', '$2b$12$fakehash8', true, false, (SELECT id FROM roles WHERE nombre='estudiante'), (SELECT id FROM estados_usuario WHERE nombre='activo'), false, false
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='estudiante_ana');
    """)
    op.execute("""
        INSERT INTO users (ci, username, email, hashed_password, is_active, is_superuser, rol_id, estado_usuario_id, is_totp_enabled, is_email_2fa_enabled)
        SELECT '1000009', 'estudiante_diego', 'diego@cea.edu', '$2b$12$fakehash9', true, false, (SELECT id FROM roles WHERE nombre='estudiante'), (SELECT id FROM estados_usuario WHERE nombre='activo'), false, false
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='estudiante_diego');
    """)
    op.execute("""
        INSERT INTO users (ci, username, email, hashed_password, is_active, is_superuser, rol_id, estado_usuario_id, is_totp_enabled, is_email_2fa_enabled)
        SELECT '1000010', 'invitado_mcp', 'mcp@local', '$2b$12$fakehash10', true, false, (SELECT id FROM roles WHERE nombre='estudiante'), (SELECT id FROM estados_usuario WHERE nombre='activo'), false, false
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='invitado_mcp');
    """)


    # Insertar perfiles asociados (si no existen)
    op.execute("""
        INSERT INTO perfiles (user_ci, nombres, apellido_paterno, apellido_materno, telefono, cargo, bio)
        SELECT u.ci, 'Administrador', 'Sistema', NULL, '70000001', 'Administrador local', 'Usuario administrador'
        FROM users u WHERE u.username = 'admin_cea'
        AND NOT EXISTS (SELECT 1 FROM perfiles WHERE user_ci = u.ci);
    """)
    op.execute("""
        INSERT INTO perfiles (user_ci, nombres, apellido_paterno, apellido_materno, telefono, cargo, bio)
        SELECT u.ci, 'Luis', 'Mamani', NULL, '70000002', 'Técnico de riego', 'Responsable de sensores'
        FROM users u WHERE u.username = 'tecnico_luis'
        AND NOT EXISTS (SELECT 1 FROM perfiles WHERE user_ci = u.ci);
    """)
    op.execute("""
        INSERT INTO perfiles (user_ci, nombres, apellido_paterno, apellido_materno, telefono, cargo, bio)
        SELECT u.ci, 'María', 'Flores', NULL, '70000003', 'Técnico de sensores', 'Mantenimiento de sensores'
        FROM users u WHERE u.username = 'tecnico_maria'
        AND NOT EXISTS (SELECT 1 FROM perfiles WHERE user_ci = u.ci);
    """)
    op.execute("""
        INSERT INTO perfiles (user_ci, nombres, apellido_paterno, apellido_materno, telefono, cargo, bio)
        SELECT u.ci, 'Juan', 'Choque', NULL, '70000004', 'Técnico de mantenimiento', 'Reparación de válvulas'
        FROM users u WHERE u.username = 'tecnico_juan'
        AND NOT EXISTS (SELECT 1 FROM perfiles WHERE user_ci = u.ci);
    """)
    op.execute("""
        INSERT INTO perfiles (user_ci, nombres, apellido_paterno, apellido_materno, telefono, cargo, bio)
        SELECT u.ci, 'Juana', 'Quispe', NULL, '70000005', 'Docente técnica', 'Encargada de prácticas'
        FROM users u WHERE u.username = 'docente_juana'
        AND NOT EXISTS (SELECT 1 FROM perfiles WHERE user_ci = u.ci);
    """)
    op.execute("""
        INSERT INTO perfiles (user_ci, nombres, apellido_paterno, apellido_materno, telefono, cargo, bio)
        SELECT u.ci, 'Pedro', 'Mamani', NULL, '70000006', 'Docente productivo', 'Coordinador de invernaderos'
        FROM users u WHERE u.username = 'docente_pedro'
        AND NOT EXISTS (SELECT 1 FROM perfiles WHERE user_ci = u.ci);
    """)
    op.execute("""
        INSERT INTO perfiles (user_ci, nombres, apellido_paterno, apellido_materno, telefono, cargo, bio)
        SELECT u.ci, 'Carlos', 'Huanca', NULL, '70000007', 'Estudiante', 'Aprendiz'
        FROM users u WHERE u.username = 'estudiante_carlos'
        AND NOT EXISTS (SELECT 1 FROM perfiles WHERE user_ci = u.ci);
    """)
    op.execute("""
        INSERT INTO perfiles (user_ci, nombres, apellido_paterno, apellido_materno, telefono, cargo, bio)
        SELECT u.ci, 'Ana', 'Calle', NULL, '70000008', 'Estudiante', 'Aprendiz'
        FROM users u WHERE u.username = 'estudiante_ana'
        AND NOT EXISTS (SELECT 1 FROM perfiles WHERE user_ci = u.ci);
    """)
    op.execute("""
        INSERT INTO perfiles (user_ci, nombres, apellido_paterno, apellido_materno, telefono, cargo, bio)
        SELECT u.ci, 'Diego', 'López', NULL, '70000009', 'Estudiante', 'Aprendiz'
        FROM users u WHERE u.username = 'estudiante_diego'
        AND NOT EXISTS (SELECT 1 FROM perfiles WHERE user_ci = u.ci);
    """)
    op.execute("""
        INSERT INTO perfiles (user_ci, nombres, apellido_paterno, apellido_materno, telefono, cargo, bio)
        SELECT u.ci, 'Servicio', 'MCP', NULL, NULL, 'Usuario del sistema MCP', 'Comunicación local'
        FROM users u WHERE u.username = 'invitado_mcp'
        AND NOT EXISTS (SELECT 1 FROM perfiles WHERE user_ci = u.ci);
    """)


def downgrade() -> None:
    pass