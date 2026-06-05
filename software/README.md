================================================================================
                    ATINA - SISTEMA DE GESTION HIDRICA
            Backend FastAPI + Frontend React / TypeScript
================================================================================

DESCRIPCION
================================================================================

ATINA es una plataforma integral para la gestion de recursos hidricos,
diseñada para la captacion de agua mediante atrapanieblas automatizados,
optimizacion del riego en invernaderos y analitica predictiva con machine
learning. El sistema incluye autenticacion segura (JWT, 2FA), control de
acceso por roles (RBAC), monitoreo IoT de dispositivos, sensores y actuadores,
gestion de solicitudes de reubicacion de recursos, tickets de mantenimiento,
alertas, reportes y visualizacion de datos.

El proyecto se compone de dos modulos principales:

  - API: Backend desarrollado con FastAPI (Python 3.11+), usando SQLAlchemy,
    PostgreSQL, Alembic para migraciones, y seguridad avanzada.

  - Frontend: Aplicacion SPA construida con React 18, TypeScript, Vite,
    TailwindCSS, Shadcn/ui y React Query para la gestion de estado y
    comunicacion con la API.

================================================================================
ESTRUCTURA DEL PROYECTO
================================================================================

.
├── API/                                 # Backend FastAPI
│   ├── alembic/                         # Migraciones de base de datos
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/                    # Archivos de migracion (31+)
│   ├── app/                             # Codigo fuente de la API
│   │   ├── api/                         # Rutas y dependencias
│   │   │   ├── deps.py
│   │   │   └── routes/                  # Endpoints por modulo
│   │   ├── core/                        # Configuracion, seguridad, DB
│   │   ├── crud/                        # Operaciones CRUD por entidad
│   │   ├── db/                          # Inicializacion y seed de datos
│   │   ├── models/                      # Modelos SQLAlchemy (15+)
│   │   ├── schemas/                     # Schemas Pydantic
│   │   ├── services/                    # Logica de negocio especifica
│   │   └── main.py
│   ├── context/                         # Documentacion de reglas de negocio
│   ├── db/                              # Diagramas PlantUML y backups SQL
│   ├── docker/                          # Scripts de entrada
│   ├── uploads/profile_photos/          # Archivos subidos
│   ├── .env.example
│   ├── alembic.ini
│   ├── docker-compose.backend.yml
│   ├── Dockerfile
│   ├── README.md
│   └── requirements.txt
│
└── frontend/                            # Frontend React
    ├── public/                          # Archivos estaticos
    │   ├── atina-logo.svg
    │   ├── favicon.svg
    │   └── icons.svg
    ├── src/                             # Codigo fuente
    │   ├── components/                  # Componentes reutilizables
    │   │   ├── ui/                      # Componentes base de shadcn
    │   │   ├── auth/                    # Componentes de autenticacion
    │   │   └── dashboard/               # Layout y sidebar
    │   ├── config/                      # Configuraciones (rutas)
    │   ├── context/                     # Contextos React (AuthContext)
    │   ├── hooks/                       # Hooks personalizados
    │   ├── lib/                         # Utilidades (axios, helpers)
    │   ├── pages/                       # Paginas de la aplicacion
    │   │   ├── dashboard/               # Vistas de administracion (14+)
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   └── WelcomeScreen.tsx
    │   ├── services/                    # Servicios API (15 servicios)
    │   ├── types/                       # Definiciones TypeScript (12+)
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── .env.example
    ├── components.json                  # Configuracion de shadcn/ui
    ├── docker-compose.frontend.yml
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── vite.config.ts
    └── README.md

================================================================================
TECNOLOGIAS UTILIZADAS
================================================================================

Backend (API)
--------------------------------------------------------------------------------
  - Python 3.11+
  - FastAPI 0.136.1
  - SQLAlchemy 2.0.49 (ORM)
  - Alembic 1.18.4 (Migraciones)
  - asyncpg / psycopg (PostgreSQL)
  - Pydantic 2.13.3 + pydantic-settings
  - python-jose (JWT)
  - bcrypt 5.0.0 (Hash de contrasenas)
  - pyotp 2.9.0 (2FA - TOTP)
  - python-multipart (Subida de archivos)
  - Pillow 12.2.0 (Procesamiento de imagenes)
  - slowapi / limits (Rate limiting)
  - gunicorn + uvicorn (Servidor ASGI)

Frontend
--------------------------------------------------------------------------------
  - React 18.2.5
  - TypeScript 6.0.2
  - Vite 8.0.10
  - TanStack React Query 5.100.11
  - React Router DOM 7.15.0
  - TailwindCSS 3.4.19
  - Shadcn/ui (Componentes)
  - Lucide React (Iconos)
  - Axios 1.16.1
  - React Hook Form 7.75.0 + Zod 4.4.3
  - Recharts 3.8.1 (Graficos)
  - jspdf, exceljs, papaparse (Exportacion)

Infraestructura
--------------------------------------------------------------------------------
  - Docker + Docker Compose
  - Nginx (Servir frontend y proxy inverso)
  - PostgreSQL 15 (Base de datos)

================================================================================
REQUISITOS PREVIOS
================================================================================

  - Docker y Docker Compose instalados (recomendado)
  - O en su defecto:
      * Python 3.11+ y pip
      * Node.js 20+ y npm
      * PostgreSQL 15 en ejecucion
  - Git

================================================================================
INSTALACION Y DESPLIEGUE CON DOCKER (RECOMENDADO)
================================================================================

1. Clonar el repositorio

   git clone https://github.com/tu-usuario/atina.git
   cd atina

2. Configurar variables de entorno

   cd API
   cp .env.example .env
   # Editar .env con tus valores

   cd ../frontend
   cp .env.example .env
   # Editar .env con la URL de la API (http://localhost:8000)

3. Levantar los servicios

   # Backend
   cd API
   docker compose -f docker-compose.backend.yml up -d --build

   # Frontend
   cd ../frontend
   docker compose -f docker-compose.frontend.yml up -d --build

4. Aplicar migraciones y seeds

   docker exec -it atina_backend_prod alembic upgrade head
   docker exec -it atina_backend_prod python -m app.db.seed

5. Acceder a la aplicacion

   - Frontend: http://localhost:8080
   - API docs: http://localhost:8000/docs

================================================================================
PRINCIPALES MODULOS DEL SISTEMA
================================================================================

Autenticacion y Usuarios
--------------------------------------------------------------------------------
  - Registro con verificacion de email, CI, username.
  - Login con JWT (access token).
  - 2FA con TOTP y dispositivos de confianza.
  - Bloqueo por intentos fallidos (3 intentos -> 2 min).
  - Roles: admin, tecnico, docente, estudiante (RBAC).
  - Perfil de usuario con foto y datos personales.

Infraestructura y Recursos
--------------------------------------------------------------------------------
  - Ubicaciones jerarquicas.
  - Invernaderos: area, prioridad de riego, estado.
  - Atrapanieblas: codigo, area de malla, orientacion.
  - Fuentes de agua: tipo, capacidad, estado.
  - Dispositivos IoT, Sensores, Actuadores.

Solicitudes de Reubicacion
--------------------------------------------------------------------------------
  - Flujo: pendiente -> en_revision -> aprobada/rechazada/cancelada.
  - Historial de cambios y documentos adjuntos.

Tickets de Mantenimiento
--------------------------------------------------------------------------------
  - Estados: pendiente, en_revision, terminado, cancelado.
  - Resultados: danado, mantenimiento, sin_falla.
  - Historial de acciones.

Alertas y Umbrales
--------------------------------------------------------------------------------
  - Alertas por condiciones anómalas.
  - Configuracion de umbrales por parametro.

Machine Learning
--------------------------------------------------------------------------------
  - Modelos de captacion de agua.
  - Control de riego predictivo.
  - Simulacion de escenarios hidricos.

Reportes y Exportacion
--------------------------------------------------------------------------------
  - Vistas predefinidas.
  - Exportacion a CSV, Excel, PDF.

================================================================================
VARIABLES DE ENTORNO
================================================================================

Backend (.env)
--------------------------------------------------------------------------------
  DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/atina
  SECRET_KEY=...                         (clave para JWT)
  ALGORITHM=HS256
  ACCESS_TOKEN_EXPIRE_MINUTES=30
  TOTP_ISSUER=ATINA
  COOKIE_SECURE=false
  COOKIE_SAMESITE=lax
  RATE_LIMIT_DEFAULT=100/minute

Frontend (.env)
--------------------------------------------------------------------------------
  VITE_API_BASE_URL=http://localhost:8000
  VITE_APP_NAME=ATINA

================================================================================
SEGURIDAD
================================================================================

  - Contrasenas hasheadas con bcrypt (costo 12).
  - Tokens JWT firmados con HS256.
  - 2FA con TOTP (RFC 6238).
  - Dispositivos de confianza (cookie segura).
  - Rate limiting (5 intentos/minuto en login/register).
  - Bloqueo temporal tras 3 fallos.
  - Validacion de fortaleza de contrasena.
  - Upload de imagenes con verificacion de tipo y tamano.
  - Control de acceso por roles (RBAC).

================================================================================
PRUEBAS Y MANTENIMIENTO
================================================================================

Migraciones
--------------------------------------------------------------------------------

  # Generar nueva migracion
  cd API
  alembic revision --autogenerate -m "descripcion"

  # Aplicar migraciones
  alembic upgrade head

  # Revertir ultima migracion
  alembic downgrade -1

Semilla de datos
--------------------------------------------------------------------------------

  docker exec -it atina_backend_prod python -m app.db.seed

Logs
--------------------------------------------------------------------------------

  docker logs atina_backend_prod
  docker logs atina_frontend_prod

================================================================================
LICENCIA
================================================================================

Este proyecto esta licenciado bajo los terminos de la Licencia MIT.
Copyright (c) 2026 Limber Ignacio Romero Urrelo.

EL SOFTWARE SE SUMINISTRA "TAL CUAL", SIN GARANTIA DE NINGUN TIPO, EXPRESA O
IMPLICITA.

Para mas informacion, consulte el archivo LICENSE en la raiz del repositorio.

================================================================================
CONTACTO
================================================================================

  - Autor: Limber Ignacio Romero Urrelo
  - Proyecto: ATINA - Sistema de Gestion Hidrica
  - Documentacion adicional: /docs en el repositorio

================================================================================