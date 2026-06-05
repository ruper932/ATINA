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
ARQUITECTURA DE DESPLIEGUE (DOCKER)
================================================================================

El sistema en produccion corre unificado detras de un unico dominio expuesto
mediante un Tunel de Cloudflare y enrutado por Nginx Proxy Manager (NPM).
Toda la comunicacion entre el navegador y la API es relativa (/api/v1),
eliminando problemas de CORS de raiz.

Requisitos Previos
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
                        desde los modulos del Frontend.

================================================================================
LICENCIA
================================================================================

Este proyecto cuenta con la licencia estipulada en el archivo LICENSE adjunto
en la raiz del repositorio.

================================================================================