================================================================================
                    ATINA - SISTEMA DE GESTION HIDRICA
                  BACKEND FASTAPI + FRONTEND REACT
================================================================================

ATINA es una plataforma integral para la gestion de recursos hidricos,
diseñada para la captacion de agua mediante atrapanieblas automatizados,
optimizacion del riego en invernaderos y analitica predictiva con machine
learning. El sistema incluye autenticacion segura (JWT, 2FA), control de
acceso por roles (RBAC), monitoreo IoT de dispositivos, sensores y actuadores,
gestion de solicitudes de reubicacion de recursos, tickets de mantenimiento,
alertas, reportes y visualizacion de datos.

El proyecto se compone de dos modulos principales: API (backend) y Frontend.

================================================================================
ESTRUCTURA DEL PROYECTO
================================================================================

El repositorio esta organizado de manera modular separando el backend
FastAPI del frontend React, cada uno con su propia infraestructura Docker.

    .
    ├── API/                       # Backend FastAPI
    │   ├── alembic/               # Migraciones de base de datos
    │   │   └── versions/          # Archivos de migracion (31+)
    │   ├── app/                   # Codigo fuente de la API
    │   │   ├── api/routes/        # Endpoints (auth, users, solicitudes, etc.)
    │   │   ├── core/              # Configuracion, seguridad, base de datos
    │   │   ├── crud/              # Operaciones CRUD por entidad
    │   │   ├── db/                # Inicializacion y seed de datos
    │   │   ├── models/            # Modelos SQLAlchemy (15+ modelos)
    │   │   ├── schemas/           # Schemas Pydantic para validacion
    │   │   └── services/          # Logica de negocio especifica
    │   ├── context/               # Documentacion de reglas de negocio
    │   ├── db/                    # Diagramas PlantUML y backups SQL
    │   ├── docker/                # Scripts de entrada para contenedores
    │   ├── uploads/profile_photos/# Archivos subidos (fotos de perfil)
    │   ├── .env.example
    │   ├── alembic.ini
    │   ├── docker-compose.backend.yml
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   └── README.md
    │
    └── frontend/                  # Frontend React
        ├── public/                # Archivos estaticos (logos, favicon)
        ├── src/                   # Codigo fuente
        │   ├── components/        # Componentes reutilizables (UI, auth, dashboard)
        │   │   └── ui/            # Componentes base de shadcn
        │   ├── config/            # Configuraciones (rutas de navegacion)
        │   ├── context/           # Contextos de React (AuthContext)
        │   ├── hooks/             # Hooks personalizados
        │   ├── lib/               # Utilidades (axios, helpers)
        │   ├── pages/             # Paginas de la aplicacion
        │   │   └── dashboard/     # Vistas de administracion (14+ modulos)
        │   ├── services/          # Servicios de comunicacion con API (15)
        │   └── types/             # Definiciones TypeScript (12+)
        ├── .env.example
        ├── components.json        # Configuracion de shadcn/ui
        ├── docker-compose.frontend.yml
        ├── Dockerfile
        ├── nginx.conf
        ├── package.json
        ├── tailwind.config.js
        ├── tsconfig.json
        ├── vite.config.ts
        └── README.md

================================================================================
STACK TECNOLOGICO
================================================================================

Backend (API)
--------------------------------------------------------------------------------
    Framework:    FastAPI 0.136.1 (Python 3.11+)
    ORM:          SQLAlchemy 2.0.49 / Alembic 1.18.4
    Base de Datos: PostgreSQL 15
    Seguridad:    JWT (python-jose), bcrypt 5.0.0, pyotp 2.9.0 (2FA)
    Servidor:     uvicorn + gunicorn

Frontend
--------------------------------------------------------------------------------
    Framework:    React 18.2.5 / TypeScript 6.0.2
    Build:        Vite 8.0.10
    Estilos:      TailwindCSS 3.4.19 / Shadcn/ui
    Estado:       TanStack React Query 5.100.11
    Routing:      React Router DOM 7.15.0
    Formularios:  React Hook Form 7.75.0 + Zod 4.4.3
    Graficos:     Recharts 3.8.1
    Exportacion:  jspdf, exceljs, papaparse

Infraestructura
--------------------------------------------------------------------------------
    Contenedores: Docker + Docker Compose
    Proxy:        Nginx (frontend) + Nginx Proxy Manager (opcional)
    Tunnel:       Cloudflare Zero Trust (opcional)

================================================================================
ARQUITECTURA DE DESPLIEGUE (DOCKER)
================================================================================

El sistema en produccion corre unificado detras de un unico dominio expuesto
mediante un Tunel de Cloudflare y enrutado por Nginx Proxy Manager (NPM).
Toda la comunicacion entre el navegador y la API es relativa (/api/v1),
eliminando problemas de CORS de raiz.

Requisitos Previos
--------------------------------------------------------------------------------
    - Docker y Docker Compose instalados en el servidor host
    - Nginx Proxy Manager corriendo y configurado (opcional)
    - Un tunel activo en Cloudflare Zero Trust apuntando al puerto 80 de NPM

Despliegue del Backend
--------------------------------------------------------------------------------
    Navegar al directorio de la API:

    cd API

    Configurar archivo .env local.

    Construir y levantar los servicios (API + Postgres):

    docker compose -f docker-compose.backend.yml up -d --build

    Aplicar migraciones de Alembic e inyectar datos semilla:

    docker exec -it atina_backend_prod alembic upgrade head
    docker exec -it atina_backend_prod python -m app.db.seed

Despliegue del Frontend
--------------------------------------------------------------------------------
    Navegar al directorio del Frontend:

    cd frontend

    Configurar archivo .env local (VITE_API_BASE_URL=http://localhost:8000)

    Recompilar e inyectar la URL relativa de la API:

    docker compose -f docker-compose.frontend.yml up -d --build --no-cache

Configuracion en Nginx Proxy Manager (NPM) - Opcional
--------------------------------------------------------------------------------
    Crear un Proxy Host para atina.tudominio.com apuntando al contenedor
    Frontend (puerto 8080) e incluir una Custom Location para redirigir el
    trafico de la API:

    Ruta: /api/v1 -> Forward Host/IP: IP_DEL_SERVIDOR -> Forward Port: 8000

Acceso a la aplicacion
--------------------------------------------------------------------------------
    - Frontend: http://localhost:8080
    - API Docs: http://localhost:8000/docs (Swagger UI)
    - API Redoc: http://localhost:8000/redoc

================================================================================
COMPONENTES PRINCIPALES
================================================================================

Autenticacion y Usuarios (/api/v1/auth, /api/v1/admin)
--------------------------------------------------------------------------------
    Registro:           Validacion de CI, email, username con verificacion de
                        fortaleza de contrasena y subida de foto de perfil.

    Login:              Autenticacion con JWT, soporte para 2FA (TOTP) y
                        dispositivos de confianza (cookie segura).

    Seguridad:          Bloqueo temporal por intentos fallidos (3 fallos -> 2min),
                        rate limiting (5 intentos/minuto).

    Roles:              RBAC con roles: admin, tecnico, docente, estudiante.

Infraestructura y Recursos (/api/v1/infra, /api/v1/iot)
--------------------------------------------------------------------------------
    Ubicaciones:        Gestion jerarquica de ubicaciones (pais, region, sitio).

    Invernaderos:       Registro de invernaderos con area, prioridad de riego.

    Atrapanieblas:      Captadores de niebla con codigo, area de malla,
                        orientacion y estado.

    Fuentes de Agua:    Fuentes con tipo, capacidad (litros) y estado.

    IoT:                Dispositivos, sensores y actuadores con estado,
                        firmware y mediciones.

Solicitudes de Reubicacion (/api/v1/solicitudes)
--------------------------------------------------------------------------------
    Flujo:              pendiente -> en_revision -> aprobada / rechazada / cancelada.

    Caracteristicas:    Historial de cambios, comentarios, documentos PDF
                        adjuntos, control por roles (docentes crean, tecnicos
                        resuelven).

Tickets de Mantenimiento (/api/v1/tickets)
--------------------------------------------------------------------------------
    Reporte:            Usuarios reportan fallas en dispositivos, sensores o
                        actuadores.

    Estados:            pendiente, en_revision, terminado, cancelado.

    Resultados:         danado (requiere reemplazo), mantenimiento (reparado),
                        sin_falla.

Alertas y Umbrales (/api/v1/alertas, /api/v1/umbrales)
--------------------------------------------------------------------------------
    Alertas:            Generacion automatica por condiciones anómalas,
                        notificaciones asociadas.

    Umbrales:           Configuracion de parametros y valores limite para
                        generacion de alertas.

Machine Learning (/api/v1/ml) --- En Desarrollo ---
--------------------------------------------------------------------------------
    Modelos:            Registro y versionado de modelos ML.

    Predicciones:       Volumen de agua captable por atrapanieblas.

    Simulaciones:       Escenarios hidricos para planificacion agricola.

Riego (/api/v1/riego)
--------------------------------------------------------------------------------
    Decisiones:         Registro de decisiones automaticas/manuales de riego.

    Eventos:            Ejecucion de riego con duracion y volumen.

    Estado Actual:      Estado actual del sistema de riego por invernadero.

Reportes (/api/v1/reportes)
--------------------------------------------------------------------------------
    Vistas:             Lecturas de sensores, alertas por invernadero,
                        inventario de dispositivos, riego ejecutado,
                        predicciones de agua.

    Exportacion:        CSV, Excel, PDF (implementado en frontend).

================================================================================
SEGURIDAD Y CONTROL DE ACCESO
================================================================================

    Autenticacion:      Implementacion de flujos JWT seguros (access_token).

    Seguridad Avanzada: Verificacion en dos pasos (2FA - TOTP), bloqueo
                        preventivo por intentos fallidos (Login Lockout),
                        dispositivos de confianza con cookie segura.

    Proteccion API:     Rate limiting por endpoint, validacion de entrada,
                        proteccion contra timing attacks en login.

    Roles:              Control de acceso basado en Roles (RBAC) gestionado
                        desde los modulos del Frontend.

    Subida de Archivos: Validacion de tipo, tamano (max 5MB) y contenido real
                        de imagenes (Pillow).

================================================================================
VARIABLES DE ENTORNO
================================================================================

Backend (API/.env)
--------------------------------------------------------------------------------
    DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/atina
    SECRET_KEY=...                         # Clave para JWT (generar una segura)
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    TOTP_ISSUER=ATINA
    COOKIE_SECURE=false                    # true en produccion con HTTPS
    COOKIE_SAMESITE=lax
    RATE_LIMIT_DEFAULT=100/minute

Frontend (frontend/.env)
--------------------------------------------------------------------------------
    VITE_API_BASE_URL=http://localhost:8000
    VITE_APP_NAME=ATINA

================================================================================
PRUEBAS Y MANTENIMIENTO
================================================================================

Migraciones (Alembic)
--------------------------------------------------------------------------------
    Generar nueva migracion:

    cd API
    alembic revision --autogenerate -m "descripcion_de_cambio"

    Aplicar migraciones:

    alembic upgrade head

    Revertir ultima migracion:

    alembic downgrade -1

Semilla de datos (Seed)
--------------------------------------------------------------------------------
    docker exec -it atina_backend_prod python -m app.db.seed

    Este comando carga datos iniciales como roles, estados, catalogos y
    usuarios de prueba.

Logs
--------------------------------------------------------------------------------
    Ver logs del backend:

    docker logs atina_backend_prod

    Ver logs del frontend:

    docker logs atina_frontend_prod

================================================================================
LICENCIA
================================================================================

Este proyecto esta licenciado bajo los terminos de la Licencia MIT.
Copyright (c) 2026 Limber Ignacio Romero Urrelo.

Se concede permiso, de forma gratuita, a cualquier persona que obtenga una
copia de este software y los archivos de documentacion asociados, para
comerciar con el Software sin restriccion, incluidos los derechos de uso,
copia, modificacion, fusion, publicacion, distribucion, sublicencia y/o venta
de copias del Software.

EL SOFTWARE SE SUMINISTRA "TAL CUAL", SIN GARANTIA DE NINGUN TIPO, EXPRESA O
IMPLICITA.

Para mas informacion, consulte el archivo LICENSE en la raiz del repositorio.

================================================================================