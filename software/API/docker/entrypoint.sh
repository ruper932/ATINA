#!/bin/sh

# Detener el script si ocurre algún error
set -e

echo "==> Aplicando migraciones de base de datos con Alembic..."
alembic upgrade head

echo "==> Iniciando servidor de producción FastAPI con Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000