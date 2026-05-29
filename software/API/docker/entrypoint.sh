#!/bin/sh
set -e

echo "Aplicando migraciones..."
alembic upgrade head

echo "Iniciando FastAPI en producción..."
exec gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 4 \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
