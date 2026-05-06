"""add roles estados usuario to users

Revision ID: 83e0c67048fa
Revises: 99aa4214f755
Create Date: 2026-05-05 19:35:07.398663
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '83e0c67048fa'
down_revision: Union[str, Sequence[str], None] = '99aa4214f755'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'estados_usuario',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=30), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nombre')
    )

    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=50), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nombre')
    )

    op.add_column('users', sa.Column('rol_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('estado_usuario_id', sa.Integer(), nullable=True))

    op.create_index(op.f('ix_users_rol_id'), 'users', ['rol_id'], unique=False)
    op.create_index(op.f('ix_users_estado_usuario_id'), 'users', ['estado_usuario_id'], unique=False)

    op.create_foreign_key(
        'fk_users_rol_id',
        'users',
        'roles',
        ['rol_id'],
        ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_users_estado_usuario_id',
        'users',
        'estados_usuario',
        ['estado_usuario_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_users_estado_usuario_id', 'users', type_='foreignkey')
    op.drop_constraint('fk_users_rol_id', 'users', type_='foreignkey')

    op.drop_index(op.f('ix_users_estado_usuario_id'), table_name='users')
    op.drop_index(op.f('ix_users_rol_id'), table_name='users')

    op.drop_column('users', 'estado_usuario_id')
    op.drop_column('users', 'rol_id')

    op.drop_table('roles')
    op.drop_table('estados_usuario')