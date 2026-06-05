================================================================================
                    ATINA - SISTEMA DE GESTION HIDRICA
            Backend FastAPI + Frontend React / TypeScript
================================================================================

DESCRIPCION
================================================================================

ATINA es una plataforma integral para la gestion de recursos hidricos,
disfenada para la captacion de agua mediante atrapanieblas automatizados,
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
├── API/                         # Backend FastAPI
│   ├── alembic/                 # Migraciones de base de datos
│   │   └── versions/            # Archivos de migracion (31+ migraciones)
│   ├── app/                     # Codigo fuente de la API
│   │   ├── api/                 # Rutas y dependencias
│   │   │   └── routes/          # Endpoints (auth, users, solicitudes, etc.)
│   │   ├── core/                # Configuracion, seguridad, base de datos
│   │   ├── crud/                # Operaciones CRUD por entidad
│   │   ├── db/                  # Inicializacion y seed de datos
│   │   ├── models/              # Modelos SQLAlchemy (15+ modelos)
│   │   ├── schemas/             # Schemas Pydantic para validacion
│   │   └── services/            # Logica de negocio especifica
│   ├── context/                 # Documentacion de contexto (reglas de negocio)
│   ├── db/                      # Diagramas PlantUML y backups SQL
│   ├── docker/                  # Scripts de entrada para contenedores
│   ├── uploads/profile_photos/  # Archivos subidos (fotos de perfil)
│   ├── .env.example             # Variables de entorno (no mostrado)
│   ├── alembic.ini              # Configuracion de Alembic
│   ├── docker-compose.backend.yml
│   ├── Dockerfile
│   ├── README.md                # Documentacion interna de la API
│   └── requirements.txt         # Dependencias Python
│
├── frontend/                    # Frontend React
│   ├── public/                  # Archivos estaticos (logos, favicon)
│   ├── src/                     # Codigo fuente
│   │   ├── components/          # Componentes reutilizables (UI, auth, dashboard)
│   │   │   └── ui/              # Componentes base de shadcn
│   │   ├── config/              # Configuraciones (rutas de navegacion)
│   │   ├── context/             # Contextos de React (AuthContext)
│   │   ├── hooks/               # Hooks personalizados (useAuth, useDebouncedValue)
│   │   ├── lib/                 # Utilidades (axios, helpers)
│   │   ├── pages/               # Paginas de la aplicacion
│   │   │   └── dashboard/       # Vistas de administracion (14+ modulos)
│   │   ├── services/            # Servicios de comunicacion con API (15 servicios)
│   │   └── types/               # Definiciones TypeScript (12+ tipos)
│   ├── .env.example
│   ├── components.json          # Configuracion de shadcn/ui
│   ├── docker-compose.frontend.yml
│   ├── Dockerfile
│   ├── nginx.conf               # Configuracion para servir el build
│   ├── package.json             # Dependencias Node
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md                    # Este archivo

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
  - bcrypt 5.0.0 (Hash de contraseñas)
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
  - jspdf, exceljs, papaparse (Exportacion de reportes)
  - qrcode.react (Generacion de codigos QR para 2FA)

Infraestructura
--------------------------------------------------------------------------------
  - Docker + Docker Compose
  - Nginx (Servir frontend y proxy inverso)
  - PostgreSQL 15 (Base de datos)
  - Cloudflare Tunnel + Nginx Proxy Manager (Opcional para produccion)

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
   # Editar .env con tus valores (base de datos, secretos, etc.)

   cd ../frontend
   cp .env.example .env
   # Editar .env con la URL de la API (por defecto: http://localhost:8000)

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
INSTALACION MANUAL (SIN DOCKER)
================================================================================

Backend
--------------------------------------------------------------------------------

   cd API

   # Crear entorno virtual
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate

   # Instalar dependencias
   pip install -r requirements.txt

   # Configurar .env (base de datos PostgreSQL)
   # Crear base de datos y ejecutar migraciones
   alembic upgrade head
   python -m app.db.seed

   # Ejecutar servidor de desarrollo
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Frontend
--------------------------------------------------------------------------------

   cd frontend

   # Instalar dependencias
   npm install

   # Configurar .env con VITE_API_BASE_URL=http://localhost:8000

   # Ejecutar en modo desarrollo
   npm run dev

   # Construir para produccion
   npm run build
   # Servir la carpeta dist con nginx o cualquier servidor static

================================================================================
PRINCIPALES MODULOS DEL SISTEMA
================================================================================

Autenticacion y Usuarios
--------------------------------------------------------------------------------
  - Registro con verificacion de email, CI, username.
  - Login con JWT (access token).
  - 2FA con TOTP (Google Authenticator) y dispositivos de confianza.
  - Bloqueo por intentos fallidos (3 intentos -> bloqueo 2 min).
  - Roles: admin, tecnico, docente, estudiante (RBAC).
  - Perfil de usuario con foto, nombres, apellidos, telefono, bio.

Infraestructura y Recursos
--------------------------------------------------------------------------------
  - Ubicaciones jerarquicas (pais, region, localidad, sitio).
  - Invernaderos: gestion de area, prioridad de riego, estado.
  - Atrapanieblas: codigo, area de malla, tipo de malla, orientacion.
  - Fuentes de agua: tipo, capacidad, estado.
  - Dispositivos IoT, Sensores, Actuadores: registro, estado, firmware.

Solicitudes de Reubicacion
--------------------------------------------------------------------------------
  - Docentes solicitan mover atrapanieblas o fuentes de agua.
  - Flujo: pendiente -> en_revision -> aprobada / rechazada / cancelada.
  - Historial de cambios, comentarios, documentos adjuntos (PDF).
  - Tecnicos pueden tomar y resolver solicitudes.

Tickets de Mantenimiento
--------------------------------------------------------------------------------
  - Reporte de fallas en dispositivos, sensores, actuadores.
  - Estados: pendiente, en_revision, terminado, cancelado.
  - Asignacion a tecnicos, resolucion con resultado (danado, mantenimiento, sin_falla).
  - Historial de acciones y comentarios.

Alertas y Umbrales
--------------------------------------------------------------------------------
  - Alertas generadas por condiciones anomalas (sensores, riego).
  - Niveles de severidad, origenes, notificaciones.
  - Configuracion de umbrales por parametro (ej. humedad minima).

Machine Learning
--------------------------------------------------------------------------------
  - Modelos de captacion de agua (ml1_captacion).
  - Control de riego predictivo (ml2_control_riego).
  - Simulacion de escenarios hidricos (ml3_simulacion).
  - Predicciones y simulaciones almacenadas en BD.

Riego y Decisiones
--------------------------------------------------------------------------------
  - Registro de decisiones de riego automaticas/manuales.
  - Eventos de riego ejecutados (duracion, volumen).
  - Estado actual de riego por invernadero.

Reportes y Exportacion
--------------------------------------------------------------------------------
  - Vistas predefinidas (lecturas de sensores, alertas por invernadero, inventario de dispositivos, riego ejecutado, predicciones de agua).
  - Exportacion a CSV, Excel, PDF desde el frontend.

================================================================================
PRINCIPALES ENDPOINTS DE LA API
================================================================================

Autenticacion (/api/v1/auth)
--------------------------------------------------------------------------------
  POST   /register               Registro de nuevo usuario (multipart/form-data)
  POST   /login                  Login (OAuth2 password grant)
  POST   /login/verify-2fa       Verificacion 2FA
  POST   /refresh                Refrescar token
  POST   /logout                 Cerrar sesion (elimina cookie)
  GET    /me                     Perfil del usuario actual
  PUT    /me                     Actualizar perfil
  PUT    /me/password            Cambiar contraseña
  POST   /2fa/setup-totp         Generar secreto TOTP
  POST   /2fa/enable-totp        Activar TOTP
  POST   /2fa/disable-totp       Desactivar TOTP

Usuarios (/api/v1/admin)
--------------------------------------------------------------------------------
  GET    /                       Listar usuarios (paginado)
  POST   /                       Crear usuario (admin)
  GET    /{ci}                   Obtener usuario
  PUT    /{ci}                   Actualizar usuario
  DELETE /{ci}                   Eliminar usuario
  GET    /roles                  Listar roles
  GET    /estados                Listar estados de usuario

Solicitudes (/api/v1/solicitudes)
--------------------------------------------------------------------------------
  GET    /                       Listar solicitudes (filtros: estado, solicitante_ci, etc.)
  POST   /                       Crear solicitud
  GET    /{solicitud_id}         Obtener detalle con historial
  PATCH  /{solicitud_id}/tomar   Tomar solicitud (tecnicos)
  PATCH  /{solicitud_id}/resolver Resolver (aprobar/rechazar)
  PATCH  /{solicitud_id}/cancelar Cancelar solicitud

Tickets (/api/v1/tickets)
--------------------------------------------------------------------------------
  GET    /                       Listar tickets
  POST   /                       Crear ticket
  GET    /{ticket_id}            Obtener detalle con historial
  PATCH  /{ticket_id}/tomar      Tomar revision
  PATCH  /{ticket_id}/resolver   Resolver (danado/mantenimiento/sin_falla)
  PATCH  /{ticket_id}/cancelar   Cancelar ticket

Otros recursos
--------------------------------------------------------------------------------
  /api/v1/infra/...              Gestion de ubicaciones, invernaderos, atrapanieblas, fuentes de agua
  /api/v1/iot/...                Dispositivos, sensores, actuadores, lecturas
  /api/v1/riego/...              Decisiones, eventos, estado actual
  /api/v1/alertas/...            Alertas y notificaciones
  /api/v1/umbrales/...           Parametros y configuraciones de umbrales
  /api/v1/ml/...                 Modelos, predicciones, simulaciones
  /api/v1/reportes/...           Reportes y sincronizaciones MCP

Documentacion interactiva de la API disponible en /docs (Swagger UI) y /redoc.

================================================================================
VARIABLES DE ENTORNO
================================================================================

Backend (.env)
--------------------------------------------------------------------------------
  DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/atina
  SECRET_KEY=...                         (clave para JWT y cookies)
  ALGORITHM=HS256
  ACCESS_TOKEN_EXPIRE_MINUTES=30
  TOTP_ISSUER=ATINA
  COOKIE_SECURE=false                    (true en produccion con HTTPS)
  COOKIE_SAMESITE=lax
  RATE_LIMIT_DEFAULT=100/minute

Frontend (.env)
--------------------------------------------------------------------------------
  VITE_API_BASE_URL=http://localhost:8000
  VITE_APP_NAME=ATINA

================================================================================
SEGURIDAD
================================================================================

  - Contraseñas hasheadas con bcrypt (salt aleatorio, costo 12).
  - Tokens JWT firmados con HS256.
  - 2FA con TOTP (RFC 6238) usando pyotp.
  - Dispositivos de confianza (cookie segura con hash SHA256).
  - Rate limiting por endpoint (5 intentos/minuto en login/register).
  - Bloqueo temporal de cuenta tras 3 fallos consecutivos.
  - Proteccion contra timing attacks (verificacion dummy en login).
  - Validacion de fortaleza de contraseña (min 8 caracteres, letras y numeros).
  - Upload de imagenes con verificacion de tipo, tamano y contenido real.
  - Roles y permisos: cada endpoint verifica el rol del usuario.

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

  # Cargar datos iniciales (roles, estados, catalogos, usuarios demo)
  docker exec -it atina_backend_prod python -m app.db.seed

  # O manualmente
  cd API
  python -m app.db.seed

Logs
--------------------------------------------------------------------------------

  # Ver logs de contenedores Docker
  docker logs atina_backend_prod
  docker logs atina_frontend_prod

================================================================================
CONTRIBUCION
================================================================================

1. Realiza un fork del repositorio.
2. Crea una rama para tu feature: git checkout -b feature/nueva-funcionalidad.
3. Realiza tus cambios siguiendo las guias de estilo (PEP8 para Python, ESLint para TypeScript).
4. Escribe pruebas cuando sea posible.
5. Asegurate de que las migraciones esten correctas.
6. Envia un pull request describiendo los cambios.

Para reportar errores o solicitar funcionalidades, usa el sistema de issues del repositorio.

================================================================================
LICENCIA
================================================================================

Este proyecto esta licenciado bajo los terminos de la Licencia MIT.
Copyright (c) 2026 Limber Ignacio Romero Urrelo.

Se concede permiso, de forma gratuita, a cualquier persona que obtenga una copia
de este software y los archivos de documentacion asociados (el "Software"), para
comerciar con el Software sin restriccion, incluidos, sin limitation, los derechos
de uso, copia, modificación, fusion, publicacion, distribucion, sublicencia y/o
venta de copias del Software, y para permitir a las personas a las que se les
proporcione el Software hacerlo, sujeto a las siguientes condiciones:

El aviso de copyright anterior y este aviso de permission se incluirán en todas
las copias o partes sustanciales del Software.

EL SOFTWARE SE SUMINISTRA "TAL CUAL", SIN GARANTIA DE NINGUN TIPO, EXPRESA O
IMPLICITA, INCLUYENDO PERO NO LIMITADO A GARANTIAS DE COMERCIALIZACION,
IDONEIDAD PARA UN PROPOSITO PARTICULAR Y NO INFRACCIoN. EN NINGUN CASO LOS
AUTORES O TITULARES DEL COPYRIGHT SERAN RESPONSABLES DE NINGUNA RECLAMACION,
DANOS U OTRA RESPONSABILIDAD, YA SEA EN UNA ACCION DE CONTRATO, AGRAVIO O
CUALQUIER OTRA FORMA, QUE SURJA DE O EN CONEXION CON EL SOFTWARE O EL USO U
OTROS TRATOS EN EL SOFTWARE.

Para mas informacion, consulte el archivo LICENSE en la raiz del repositorio.

================================================================================
CONTACTO Y SOPORTE
================================================================================

  - Autor: Limber Ignacio Romero Urrelo
  - Proyecto: ATINA - Sistema de Gestion Hidrica
  - Repositorio: [https://github.com/ruper932/ATINA]
  - Documentacion adicional: /docs en el repositorio

================================================================================