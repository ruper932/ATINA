================================================================================
                    ATINA - SISTEMA INTELIGENTE DE OPTIMIZACION
                  RECOLECCION Y PREDICCION DE AGUA
================================================================================

ATINA es una plataforma tecnologica e integradora disenada para la captura de
agua mediante atrapanieblas automatizados, optimizacion del uso hidrico a
traves de sistemas de control de riego, y analitica predictiva basada en
Machine Learning. El sistema esta especialmente disenado para entornos
agricolas y educativos, proporcionando resiliencia hidrica y automatizacion
IoT.

================================================================================
ARQUITECTURA DEL SISTEMA
================================================================================

Diagrama de Arquitectura (Docker + Nginx + FastAPI + React + PostgreSQL)

+---------------------------------------------------------------------------------+
|                              NAVEGADOR WEB                                     |
|                            (https://atina.dominio.com)                         |
+---------------------------------------+-----------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                         CLOUDFLARE TUNNEL (opcional)                           |
|                      (Proxy inverso con certificado SSL)                       |
+---------------------------------------+-----------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                           NGINX PROXY MANAGER (NPM)                             |
|                                   Puerto: 80 / 443                              |
+---------------------------------------+-----------------------------------------+
                                        |
                    +--------------------+--------------------+
                    |                                         |
                    v                                         v
+-------------------------------+   +-------------------------------------------+
|         CONTENEDOR FRONTEND    |   |           CONTENEDOR BACKEND              |
|                               |   |                                           |
|  Nginx Servidor Web           |   |  FastAPI (uvicorn)                        |
|  Puerto: 8080 (expuesto)      |   |  Puerto: 8000 (interno)                   |
|                               |   |                                           |
|  Archivos staticos (build)    |   |  - Rutas API (/api/v1/*)                  |
|                               |   |  - Logica de negocio                      |
+-------------------------------+   +-------------------+-----------------------+
                    |                                         |
                    | (solicitudes API /api/v1/*)             |
                    +-----------------------------------------+
                                                              |
                                                              v
                                          +-----------------------------------+
                                          |      CONTENEDOR POSTGRESQL        |
                                          |                                   |
                                          |  PostgreSQL 15                    |
                                          |  Puerto: 5432 (interno)           |
                                          |                                   |
                                          |  - Base de datos ATINA            |
                                          |  - Tablas: users, solicitudes,    |
                                          |    tickets, dispositivos, etc.    |
                                          +-----------------------------------+

Comunicacion entre contenedores:
  - Frontend (Nginx) escucha en puerto 8080, sirve la SPA.
  - Las peticiones a /api/v1/* se redirigen al backend.
  - Backend (FastAPI) escucha en puerto 8000 y conecta a PostgreSQL.
  - PostgreSQL escucha en puerto 5432 (solo interno, no expuesto).
  - Red Docker interna: "atina_network" (bridge).

Para entornos locales sin Cloudflare/NPM:
  - Frontend: http://localhost:8080
  - Backend API: http://localhost:8000
  - API Docs: http://localhost:8000/docs

================================================================================
ESTRUCTURA DEL PROYECTO
================================================================================

El repositorio esta organizado de manera modular separando la documentacion
de ingenieria, los microservicios de analitica, el firmware de hardware y el
software de produccion:

    .
    ├── data/                  # Datasets (raw, procesados y ejemplos)
    ├── database/              # Disenos de la base de datos (DBML, diagramas fisicos)
    ├── datasets/              # Volcados de bases de datos iniciales (.sql)
    ├── docs/                  # Documentacion de requerimientos, diagramas PlantUML y manuales
    ├── firmware/              # Codigo para microcontroladores (ESP32) y simuladores
    ├── hardware/              # Esquemas electronicos, fotos y especificaciones de sensores
    ├── mockups/               # Prototipos estaticos de la interfaz en HTML
    ├── notes/                 # Notas de desarrollo y apuntes internos
    ├── services/              # Microservicios complementarios (Dashboard Django, ML, MCP Server)
    └── software/              # Nucleo de la aplicacion en produccion (Stack Principal)
        ├── API/               # Backend en FastAPI, migraciones Alembic y logica de negocio
        └── frontend/          # SPA en React + Vite + TypeScript + TailwindCSS + Shadcn/ui

================================================================================
STACK TECNOLOGICO
================================================================================

Core Software
--------------------------------------------------------------------------------
    Backend:      Python 3.11+ / FastAPI (REST API de alto rendimiento)
    ORM:          SQLModel / SQLAlchemy / Alembic
    Base de Datos: PostgreSQL 15
    Frontend:     React 18 / Vite / TypeScript / Tailwind CSS / Shadcn UI

IoT y Analitica
--------------------------------------------------------------------------------
    Firmware:     ESP-IDF / Python (Simulacion y logica IoT en ESP32)
    ML:           Jupyter Notebooks, Scikit-Learn
    IA:           Servidor MCP (Model Context Protocol)

================================================================================
INSTALACION Y ENTORNO LOCAL
================================================================================

Requisitos Previos
--------------------------------------------------------------------------------
    - Docker y Docker Compose instalados
    - Git
    - Puerto 8080 y 8000 disponibles

Pasos para levantar el proyecto en entorno local
--------------------------------------------------------------------------------

    1. Clonar el repositorio

    git clone https://github.com/tu-usuario/atina.git
    cd atina

    2. Copiar variables de entorno

    # Backend
    cd software/API
    cp .env.example .env

    # Frontend
    cd ../frontend
    cp .env.example .env

    # Editar .env del frontend con la URL de la API
    # VITE_API_BASE_URL=http://localhost:8000

    3. Levantar todos los servicios

    # Desde la raiz del proyecto o desde cada modulo
    cd software/API
    docker compose -f docker-compose.backend.yml up -d --build

    cd ../frontend
    docker compose -f docker-compose.frontend.yml up -d --build

    4. Aplicar migraciones y seeds

    docker exec -it atina_backend_prod alembic upgrade head
    docker exec -it atina_backend_prod python -m app.db.seed

    5. Acceder a la aplicacion

    - Frontend: http://localhost:8080
    - API Docs: http://localhost:8000/docs

Opcion simplificada (si existe docker-compose unificado en la raiz):
--------------------------------------------------------------------------------

    # Desde la raiz del proyecto
    docker compose up --build

================================================================================
USUARIOS DE PRUEBA
================================================================================

Los siguientes usuarios estan preconfigurados en el seed de la base de datos.
Para la verificacion en dos pasos (2FA), se puede utilizar Google Authenticator
o cualquier aplicacion TOTP compatible.

Credenciales de acceso
--------------------------------------------------------------------------------

    Rol             | Email                  | Contrasena    | 
    ----------------+------------------------+---------------+
    Administrador   | admin@prueba.com       | Admin123!     | 
    Docente         | pedro@cea.edu          | Docente123!   | 
    Tecnico         | maria@cea.edu          | Tecnico123!   | 
    Estudiante      | user@prueba.com        | User123!      | 
    Invitado        | invitado@cea.edu       | Invitado123!  | 

Configuracion del 2FA (TOTP)
--------------------------------------------------------------------------------

    1. Descargar Google Authenticator o cualquier app TOTP (Authy, Microsoft Authenticator).
    2. Abrir la app y escanear el codigo QR o introducir manualmente el secreto.
    3. Iniciar sesion con email y contrasena.
    4. Ingresar el codigo de 6 digitos generado por la app.


================================================================================
CHECKLIST DE FUNCIONALIDADES VERIFICABLES
================================================================================

La siguiente lista permite validar que todas las funcionalidades principales
del sistema operan correctamente:

    [x] Registro de usuario
        - Acceder a /register
        - Completar formulario (CI, email, username, contrasena, nombres)
        - Verificar registro exitoso

    [x] Login con email/contraseña
        - Acceder a /login
        - Ingresar credenciales validas
        - Obtener redireccion a dashboard

    [x] Solicitud de codigo 2FA tras login correcto
        - Login con usuario que tiene 2FA habilitado
        - Ver pantalla de ingreso de codigo TOTP

    [x] Verificacion de codigo TOTP
        - Ingresar codigo correcto de 6 digitos
        - Acceder al dashboard
        - Ingresar codigo incorrecto -> error

    [x] Checkbox "Confiar en este equipo" funcional
        - Marcar opcion al verificar 2FA
        - Verificar que no solicita 2FA en proximos 30 dias
        - Revisar tabla trusted_devices en BD

    [x] Acceso a rutas protegidas solo con JWT valido
        - Intentar acceder a /dashboard sin token -> redirige a login
        - Token expirado -> redirige a login
        - Token valido -> acceso permitido

    [x] Diferentes vistas/permisos para ADMIN y USER
        - Login como admin: ver todos los modulos
        - Login como docente: ver solo modulos permitidos
        - Intentar acceder a ruta restringida -> 403

    [x] Cierre de sesion
        - Hacer clic en boton "Cerrar sesion"
        - Token invalidado
        - Redireccion a login

    [x] Despliegue en la nube accesible por HTTPS
        - Acceder a https://atina.ruper-priv.uk
        - Certificado SSL valido (Let's Encrypt)
        - Todas las peticiones API via HTTPS

Funcionalidades adicionales (backend)
--------------------------------------------------------------------------------

    [ ] CRUD de usuarios (admin)
    [ ] CRUD de ubicaciones
    [ ] CRUD de atrapanieblas
    [ ] CRUD de fuentes de agua
    [ ] CRUD de dispositivos IoT
    [ ] Gestion de solicitudes de reubicacion
    [ ] Gestion de tickets de mantenimiento
    [ ] Generacion de reportes (CSV, Excel, PDF)

================================================================================
ARQUITECTURA DE DESPLIEGUE (DOCKER)
================================================================================

El sistema en produccion corre unificado detras de un unico dominio expuesto
mediante un Tunel de Cloudflare y enrutado por Nginx Proxy Manager (NPM).
Toda la comunicacion entre el navegador y la API es relativa (/api/v1),
eliminando problemas de CORS de raiz.

Requisitos Previos (Produccion)
--------------------------------------------------------------------------------
    - Docker y Docker Compose instalados en el servidor host
    - Nginx Proxy Manager corriendo y configurado
    - Un tunel activo en Cloudflare Zero Trust apuntando al puerto 80 de NPM

Despliegue del Backend
--------------------------------------------------------------------------------
    Navegar al directorio de la API:

    cd software/API

    Configurar archivo .env local.

    Construir y levantar los servicios (API + Postgres):

    docker compose -f docker-compose.backend.yml up -d --build

    Aplicar migraciones de Alembic e inyectar datos semilla:

    docker exec -it atina_backend_prod alembic upgrade head
    docker exec -it atina_backend_prod python -m app.db.seed

Despliegue del Frontend
--------------------------------------------------------------------------------
    Navegar al directorio del Frontend:

    cd software/frontend

    Configurar .env con VITE_API_BASE_URL=https://atina.dominio.com

    Recompilar e inyectar la URL relativa de la API:

    docker compose -f docker-compose.frontend.yml up -d --build --no-cache

Configuracion en Nginx Proxy Manager (NPM)
--------------------------------------------------------------------------------
    Crear un Proxy Host para atina.tudominio.com apuntando al contenedor
    Frontend (puerto 8080) e incluir una Custom Location para redirigir el
    trafico de la API:

    Ruta: /api/v1 -> Forward Host/IP: IP_DEL_SERVIDOR -> Forward Port: 8000

================================================================================
COMPONENTES PRINCIPALES
================================================================================

Modelos de Machine Learning (/services/ml) --- En Desarrollo ---
--------------------------------------------------------------------------------
    ml1_captacion:      Modelos predictivos para calcular el volumen de agua
                        recolectable por los atrapanieblas segun variables
                        meteorologicas (humedad, velocidad del viento, punto
                        de rocio).

    ml2_control_riego:  Algoritmica inteligente para la toma de decisiones
                        automatizada sobre cuando y cuanto regar los
                        invernaderos.

    ml3_simulacion:     Modelado predictivo de escenarios hidricos para la
                        planificacion agricola a mediano plazo.

Firmware e IoT (/firmware) --- En Desarrollo ---
--------------------------------------------------------------------------------
    Contiene los scripts controladores para las estaciones de sensores de
    humedad de suelo, caudalimetros, temperatura ambiental y los actuadores
    de las electrovalvulas de riego, junto con un entorno de simulacion local
    en Python.

Documentacion (/docs)
--------------------------------------------------------------------------------
    Contiene los diagramas de ingenieria de software en formato PlantUML
    (.puml) y SVG que detallan los casos de uso, diagramas de clases,
    secuencias y la matriz de casos de prueba del sistema.

================================================================================
SEGURIDAD Y CONTROL DE ACCESO
================================================================================

    Autenticacion:      Implementacion de flujos JWT seguros (almacenados bajo
                        access_token).

    Seguridad Avanzada: Soporte para verificacion en dos pasos (2FA),
                        bloqueo preventivo por intentos fallidos (Login
                        Lockout) y registro/autenticacion biometrica
                        experimental en rutas administrativas.

    Roles:              Control de acceso basado en Roles (RBAC) gestionado
                        desde los modulos del Frontend: Admin, Tecnico,
                        Docente, Estudiante.

================================================================================
SOLUCION DE PROBLEMAS COMUNES
================================================================================

Error: "Connection refused" al conectar backend
--------------------------------------------------------------------------------
    Verificar que el contenedor backend este corriendo:
    docker ps | grep atina_backend

    Verificar logs:
    docker logs atina_backend_prod

Error: Migracion fallida
--------------------------------------------------------------------------------
    Recrear base de datos desde cero:
    docker compose -f docker-compose.backend.yml down -v
    docker compose -f docker-compose.backend.yml up -d --build
    docker exec -it atina_backend_prod alembic upgrade head

Error: 2FA no funciona
--------------------------------------------------------------------------------
    Verificar que el usuario tenga is_totp_enabled = true en la BD
    Verificar que el secreto TOTP este almacenado correctamente
    Asegurar que la hora del servidor este sincronizada (NTP)

Error: Puerto 8080 o 8000 ya en uso
--------------------------------------------------------------------------------
    Cambiar puertos en docker-compose.yml o detener servicios conflictivos:
    sudo lsof -i :8080
    sudo kill -9 <PID>

================================================================================
LICENCIA
================================================================================

Este proyecto cuenta con la licencia estipulada en el archivo LICENSE adjunto
en la raiz del repositorio.

================================================================================