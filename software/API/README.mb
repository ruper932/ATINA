# Atina - Sistema Inteligente de Monitoreo y Predicción

Plataforma backend para el monitoreo de recolección de agua mediante atrapanieblas y gestión automatizada de riego en invernaderos. Integra IoT (sensores y actuadores locales), Machine Learning (predicciones hídricas) y sincronización con un servidor MCP (Model Context Protocol).

## 🚀 Requisitos Previos

Asegúrate de tener instalado lo siguiente en tu entorno local:

- **Python 3.10+**
- **PostgreSQL 14+**
- **Git**

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <url-de-tu-repositorio>
cd atina-backend
```

### 2. Configurar el Entorno Virtual

Es recomendable aislar las dependencias del proyecto utilizando un entorno virtual (`venv`):

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual (Linux/macOS)
source venv/bin/activate

# Activar entorno virtual (Windows PowerShell)
venv\Scripts\activate
```

### 3. Instalar Dependencias

Con el entorno virtual activado, instala las librerías necesarias:

```bash
pip install -r requirements.txt
```
*(Asegúrate de que dependencias como `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `asyncpg` y `psycopg2-binary` estén en tu `requirements.txt`).*

### 4. Configurar la Base de Datos

Crea una base de datos vacía en PostgreSQL. Puedes hacerlo desde `psql` o pgAdmin:

```sql
CREATE DATABASE atina_db;
```

### 5. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (puedes basarte en un `.env.example` si existe) y configura tu cadena de conexión. Como estamos usando SQLAlchemy con soporte asíncrono, la URL debe usar el driver `asyncpg` u omitirlo para que `db.py` lo reemplace dinámicamente (según la configuración de tu `settings`):

```env
# Ejemplo de archivo .env
DATABASE_URL=postgresql+asyncpg://usuario:contraseña@localhost:5432/atina_db
DEBUG=True
```

## 🗄️ Base de Datos: Migraciones y Semillas (Seeding)

El proyecto utiliza **Alembic** para el control de versiones del esquema y un script nativo para la carga de datos iniciales (catálogos).

### Paso 1: Ejecutar Migraciones

Para construir la estructura de tablas, índices y relaciones en PostgreSQL, ejecuta:

```bash
alembic upgrade head
```
*Esto aplicará todas las migraciones hasta llegar a la última versión, creando tablas como `users`, `roles`, `invernaderos`, `lecturas_sensor`, etc.*

### Paso 2: Poblar Catálogos (Seeding)

La base de datos requiere valores por defecto obligatorios para funcionar (roles, estados de dispositivos, tipos de sensores, severidad de alertas, etc.). Ejecuta el seeder para insertarlos:

```bash
python -m app.db.seed
```
*Si todo es correcto, verás en consola el mensaje: `Seed de catálogos completado exitosamente.` Este comando es seguro de ejecutar múltiples veces (es idempotente).*

## 🏃‍♂️ Ejecutar la Aplicación

Para levantar el servidor de desarrollo con recarga automática (Hot Reload), utiliza Uvicorn:

```bash
uvicorn app.main:app --reload
```

El servidor estará disponible por defecto en:
- **API**: http://127.0.0.1:8000
- **Documentación Swagger UI**: http://127.0.0.1:8000/docs
- **Documentación ReDoc**: http://127.0.0.1:8000/redoc

## 📁 Estructura del Proyecto

```text
├── alembic/                # Configuraciones y revisiones de migraciones DB
├── app/
│   ├── core/               # Configuraciones principales (settings, seguridad, db.py)
│   ├── db/                 # Scripts de base de datos (seed.py)
│   ├── models/             # Modelos SQLAlchemy (catalogos.py, user.py, riego.py, etc.)
│   ├── schemas/            # Esquemas Pydantic (validación de datos)
│   ├── api/                # Endpoints y enrutadores FastAPI
│   └── main.py             # Punto de entrada de la aplicación FastAPI
├── .env                    # Variables de entorno (ignorado en git)
├── alembic.ini             # Archivo de configuración de Alembic
└── requirements.txt        # Dependencias de Python
```

## ⚙️ Comandos Útiles de Alembic

Si necesitas hacer modificaciones a los modelos SQLAlchemy en el futuro (`app/models/`):

1. **Generar una nueva migración (tras cambiar modelos):**
   ```bash
   alembic revision --autogenerate -m "descripcion_del_cambio"
   ```
2. **Aplicar la nueva migración:**
   ```bash
   alembic upgrade head
   ```
3. **Revertir la última migración (Rollback):**
   ```bash
   alembic downgrade -1
   ```