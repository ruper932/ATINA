import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.routes import (
    alertas,
    auth,
    dispositivos,
    health,
    infraestructura,
    invernaderos,
    ml,
    reportes,
    riego,
    umbrales,
    usuarios,
    solicitudes,
)
from app.core.config import settings


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


app.include_router(
    health.router,
    prefix=f"{settings.API_V1_STR}/health",
    tags=["Health"],
)

app.include_router(
    invernaderos.router,
    prefix=f"{settings.API_V1_STR}/invernaderos",
    tags=["Infraestructura"],
)

app.include_router(
    infraestructura.router,
    prefix=f"{settings.API_V1_STR}/infra",
    tags=["Infraestructura"],
)

app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Autenticación y Seguridad"],
)

app.include_router(
    dispositivos.router,
    prefix=f"{settings.API_V1_STR}/iot",
    tags=["IoT y Dispositivos"],
)

app.include_router(
    riego.router,
    prefix=f"{settings.API_V1_STR}/riego",
    tags=["Gestión de Riego"],
)

app.include_router(
    usuarios.router,
    prefix=f"{settings.API_V1_STR}/admin",
    tags=["Administración de Usuarios"],
)

app.include_router(
    alertas.router,
    prefix=f"{settings.API_V1_STR}/alertas",
    tags=["Gestión de Alertas"],
)

app.include_router(
    umbrales.router,
    prefix=f"{settings.API_V1_STR}/umbrales",
    tags=["Configuración de Umbrales"],
)

app.include_router(
    ml.router,
    prefix=f"{settings.API_V1_STR}/ml",
    tags=["Machine Learning"],
)

app.include_router(
    reportes.router,
    prefix=f"{settings.API_V1_STR}/reportes",
    tags=["Reportes y Sincronización"],
)

app.include_router(
    solicitudes.router,
    prefix=f"{settings.API_V1_STR}/solicitudes",
    tags=["Solicitudes para ubicaciones."],
)



@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Bienvenido a {settings.APP_NAME}",
        "docs": "/docs",
        "openapi": f"{settings.API_V1_STR}/openapi.json",
    }