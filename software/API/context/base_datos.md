# Contexto de Arquitectura de Datos: Proyecto ATINA
**Sistema Inteligente de Automatización Agrícola y Gestión Hídrica por Atrapanieblas**

Este archivo sirve como fuente de verdad y contexto definitivo para modelos de Inteligencia Artificial (LLMs) que colaboren en el desarrollo del backend, integraciones IoT, scripts de Machine Learning o migraciones de base de datos (`Alembic`).

---

## 🤖 PROMPT DE INICIALIZACIÓN DE CONTEXTO (Copiar esta sección a la IA)
> "Actúa como un Ingeniero de Software Senior especializado en FastAPI, PostgreSQL y Sistemas IoT Embebidos. Estás asignado al proyecto **ATINA**, una plataforma de automatización de riego de precisión e inteligencia climática que optimiza el uso de agua recolectada mediante sistemas de atrapanieblas en invernaderos. Tu objetivo es ayudarme a construir endpoints, modelos de SQLAlchemy/SQLModel, esquemas de Pydantic, consultas optimizadas y lógica de control de hardware basándote estrictamente en el diccionario de datos, relaciones y reglas de negocio descritos a continuación. Comprende la estructura antes de proponer código."

---

## 📑 1. Resumen de la Pila Tecnológica del Backend
- **Motor de Base de Datos:** PostgreSQL 18.4
- **Framework Web API:** FastAPI (Python 3.10+)
- **ORM / Capa de Datos:** SQLAlchemy con migraciones gestionadas por **Alembic**.
- **Seguridad:** Criptografía nativa con la extensión `pgcrypto` en Postgres; Autenticación con soporte MFA (TOTP / Email) administrada desde el backend de FastAPI.
- **Enfoque de Negocio:** Ingesta de telemetría en tiempo real (sensores), orquestación de actuadores (electroválvulas) y consumo de microservicios o artefactos de Machine Learning para predicción analítica de disponibilidad hídrica.

---

## 📐 2. Mapa de Relaciones del Sistema (Esquema Conceptual)

El sistema organiza sus flujos en base a las siguientes interconexiones de llaves foráneas:
[ubicaciones] (Jerárquica)
▲
│ (Fiel a la geografía)
├──► [invernaderos] ◄─────── [actuadores_invernaderos] ◄─── [actuadores]
│                                                                ▲
└──► [atrapanieblas]                                             │ (Comando físico)
▲                                                      │
│ (N:M a través de intermedia)                         │
[fuentes_agua_atrapanieblas] ◄── [fuentes_agua]               │
│
[dispositivos] (Gateways IoT)                                         │
├──► [sensores] ────► [lecturas_sensor]                          │
└────────────────────────────────────────────────────────────────┘

[modelos_ml] ────► [predicciones_ml] ────► [decisiones_riego] ────► [eventos_riego]

---

## 🗂️ 3. Diccionario de Datos y Estructura de Tablas

### 🔀 Módulo 3.1: Infraestructura y Activos Físicos

#### `ubicaciones`
Representa el árbol geográfico o topológico del proyecto. Permite estructuras jerárquicas recursivas (ej. Región > Sector > Parcela).
- **Campos Clave:** `id` (PK), `tipo_ubicacion_id` (FK), `ubicacion_padre_id` (FK, nullable, autoreferenciado), `nombre`, `latitud`, `longitud`, `altitud_m`.
- **Regla de IA:** Utiliza consultas recursivas (*Common Table Expressions - CTE*) en SQLAlchemy si requieres heredar configuraciones o alertas desde una ubicación padre.

#### `invernaderos`
Zonas de cultivo protegido donde se aplica el riego automatizado.
- **Campos Clave:** `id` (PK), `ubicacion_id` (FK), `codigo` (Unique), `nombre`, `area_m2`, `prioridad_riego`.
- **Restricciones de Datos (Constraints):** - `check_area_m2_positiva`: `area_m2 > 0`
  - `check_prioridad_riego_rango`: `prioridad_riego BETWEEN 1 AND 10` (Define el orden de despacho de agua en escenarios de escasez severa).

#### `atrapanieblas`
Estructuras físicas de captación de agua atmosférica mediante condensación en mallas.
- **Campos Clave:** `id` (PK), `ubicacion_id` (FK), `codigo` (Unique), `nombre`, `material_malla`, `area_malla_m2`, `orientacion`.
- **Constraints:** `check_area_malla_positiva`: `area_malla_m2 > 0`.

#### `fuentes_agua`
Depósitos, tanques o reservorios que almacenan el recurso hídrico capturado.
- **Campos Clave:** `id` (PK), `ubicacion_id` (FK), `codigo` (Unique), `nombre`, `capacidad_l`.
- **Constraints:** `check_capacidad_positiva`: `capacidad_l >= 0`.

#### `fuentes_agua_atrapanieblas`
Tabla intermedia que rompe la relación Muchos a Muchos (N:M). Indica qué mallas atrapanieblas tributan o descargan agua en qué tanques de almacenamiento.
- **Campos Clave:** `fuentes_agua_id` (FK), `atrapanieblas_id` (FK). Formada por una PK compuesta.

---

### 📟 Módulo 3.2: Ecosistema IoT (Hardware y Telemetría)

#### `dispositivos`
Nodos o controladores físicos locales (ej. Microcontroladores ESP32 con firmware dedicado) que gestionan el hardware de campo.
- **Campos Clave:** `id` (PK), `codigo` (Unique), `nombre`, `ip_local` (Dirección IPv4 del nodo), `version_firmware`.

#### `tipos_sensor` y `tipos_actuador`
Tablas de catálogo que tipifican los componentes de hardware.
- **Campos Clave (`tipos_sensor`):** `id` (PK), `codigo` (Unique), `nombre`, `variable_medida` (ej. humedad, caudal), `unidad_base` (ej. °C, %, L/min).

#### `sensores`
Dispositivos de entrada vinculados a un controlador IoT para medir el entorno.
- **Campos Clave:** `id` (PK), `dispositivo_id` (FK), `tipo_sensor_id` (FK), `codigo` (Unique), `nombre`, `precision_valor`, `numero_serie`.

#### `actuadores`
Dispositivos de salida física capaces de modificar el estado hídrico del sistema (ej. electroválvulas de paso de agua).
- **Campos Clave:** `id` (PK), `dispositivo_id` (FK), `tipo_actuador_id` (FK), `codigo` (Unique), `nombre`, `estado_actual` (Opciones controladas por lógica: 'abierto', 'cerrado', 'error').

#### `actuadores_invernaderos`
Asigna de forma unívoca qué actuadores (ej. Válvula `VALV-INV-01`) ejercen el control del suministro de agua sobre qué invernadero (`INV-01`).
- **Campos Clave:** `actuadores_id` (FK), `invernaderos_id` (FK).

#### `lecturas_sensor`
Tabla de alta transaccionalidad (Time-Series) donde se aloja el histórico de datos de telemetría.
- **Campos Clave:** `id` (BigPK), `sensor_id` (FK), `calidad_dato_id` (FK, apunta a 'valido', 'estimado', 'erroneo'), `valor`, `fecha_registro` (Timestamp con zona horaria), `metadatos_json` (Tipo de dato `jsonb` de Postgres para máxima flexibilidad en payloads crudos).

---

### 🧠 Módulo 3.3: Inteligencia Artificial y Automatización de Riego

#### `modelos_ml`
Catálogo y registro de versiones de los modelos de Machine Learning desplegados.
- **Campos Clave:** `id` (PK), `codigo`, `version`, `framework` (ej. 'scikit-learn', 'tensorflow'), `ruta_artefacto` (Path del archivo `.pkl`, `.h5` u ONNX).

#### `predicciones_ml`
Inferencia de datos generada por la IA sobre la disponibilidad de agua esperada.
- **Campos Clave:** `id` (PK), `modelo_ml_id` (FK), `fecha_prediccion`, `horizonte_tiempo`, `volumen_predicho_l`, `margen_error`, `porcentaje_confianza`.

#### `simulaciones_ml`
Proyecciones predictivas de escenarios de riesgo climático (ej. heladas, sequía extrema prolongada).
- **Campos Clave:** `id` (PK), `modelo_ml_id` (FK), `nivel_riesgo_id` (FK), `fecha_simulacion`, `variables_simuladas` (`jsonb`).

#### `decisiones_riego`
El núcleo de la automatización. Registra la instrucción analítica generada por el software o algoritmo de IA indicando cuánto regar basándose en las predicciones.
- **Campos Clave:** `id` (PK), `modelo_ml_id` (FK, Nullable si es manual), `volumen_calcular_l`, `justificacion` (Texto explicativo generado por el motor de reglas).

#### `estado_riego_actual`
Guarda el estado operativo en vivo de las colas de riego pendientes o en ejecución.
- **Campos Clave:** `id` (PK), `invernadero_id` (FK), `decision_riego_id` (FK), `estado` (ej. 'pendiente', 'regando', 'completado').

#### `eventos_riego`
Auditoría física post-ejecución que valida si el agua propuesta por la decisión de IA se aplicó correctamente en el campo.
- **Campos Clave:** `id` (PK), `actuador_id` (FK), `decision_riego_id` (FK), `inicio_evento`, `fin_evento`, `duracion_segundos`, `volumen_aplicado_l`.
- **Constraints:**
  - `check_fechas_evento`: `fin_evento >= inicio_evento`
  - `check_duracion_positiva`: `duracion_segundos >= 0`

#### `metricas_decision_riego`
Tabla analítica para evaluar el rendimiento hídrico del sistema mediante la comparativa: *Agua Disponible vs Demanda de IA vs Consumo Real*.
- **Campos Clave:** `id` (PK), `decision_riego_id` (FK), `volumen_disponible_fuentes_l`, `demanda_teorica_l`, `volumen_real_aplicado_l`.

---

### ⚠️ Módulo 3.4: Reglas, Umbrales y Gestión de Alertas

#### `configuraciones_umbral` y `parametros_umbral`
Define las cotas operativas de seguridad para variables críticas (ej. Humedad mínima del suelo). Los ámbitos definen si el umbral afecta de manera Global o específicamente a un Invernadero.
- **Campos Clave (`configuraciones_umbral`):** `id` (PK), `ambito_umbral_id` (FK), `invernadero_id` (FK, Nullable).

#### `alertas`
Eventos de error del sistema o fallas de lógica detectados por los workers del backend o por triggers.
- **Campos Clave:** `id` (PK), `dispositivo_id` (FK, Null), `sensor_id` (FK, Null), `severidad_alerta_id` (FK), `mensaje_error`, `fecha_generacion`, `fecha_reconocimiento`, `usuario_reconocimiento_ci` (Cédula del operador que solventó la alerta).
- **Constraints:** `check_fechas_alerta`: `fecha_reconocimiento >= fecha_generacion` (Evita inconsistencias en logs temporales).

---

### 🛡️ Módulo 3.5: Autenticación, Seguridad y Trazabilidad

#### `users` (Usuarios del Sistema)
Modelo central de credenciales y seguridad con resguardo estricto ante ataques.
- **Campos Clave:** `id` (PK), `username` (Unique), `email` (Unique), `password_hash`, `is_active`, `failed_login_attempts` (Contador para bloqueos), `locked_until` (Timestamp de desbloqueo), `is_totp_enabled`, `totp_secret`, `is_email_2fa_enabled`.

#### `perfiles`
Extensión de información personal de los operadores e ingenieros del sistema.
- **Campos Clave:** `id` (PK), `user_id` (FK), `cedula_identidad` (Unique / Clave de negocio), `nombre`, `apellido`, `telefono`.

#### `auditoria_acciones`
Registro forense inmutable de mutaciones en el sistema a nivel backend.
- **Campos Clave:** `id` (BigPK), `usuario_ci` (Rastreo por Cédula), `accion` (ej. 'LOGIN', 'ACTUALIZAR_UMBRAL'), `tabla_afectada`, `detalles_cambio` (Usa `jsonb` estructurado guardando `{"valor_anterior": x, "valor_nuevo": y}`), `ip_origen` (Tipo de dato de red nativo `inet` de PostgreSQL), `fecha_accion`.

---

## 📊 4. Capa de Reportabilidad Integrada (Vistas SQL)
El backend en FastAPI puede consumir directamente estas vistas optimizadas para alimentar gráficos en el frontend sin sobrecargar el servidor con joins manuales:

1.  **`vista_reporte_lecturas_sensor`:** Aplana la telemetría asociando códigos de sensores, variables medidas y unidades base.
2.  **`vista_reporte_alertas_invernadero`:** Consolida fallas activas filtradas por criticidad e infraestructura dañada.
3.  **`vista_reporte_inventario_dispositivos`:** Auditoría rápida del estado del hardware en campo.
4.  **`vista_reporte_predicciones_agua`:** Despliega el balance hídrico predictivo calculado por los modelos analíticos.
5.  **`vista_reporte_riego_ejecutado`:** Historial unificado de órdenes de riego automatizadas y su duración real en segundos.

---

## 🛠️ 5. Reglas de Negocio Críticas para el Desarrollo de la API
Cuando generes endpoints en FastAPI, asegúrate de cumplir con los siguientes flujos deducidos por el esquema relacional:

1.  **Validación de Riego por Disponibilidad:** Antes de despachar un riego desde `estado_riego_actual`, la API debe consultar la suma de la `capacidad_l` en las `fuentes_agua` asociadas al invernadero meta. Si el volumen demandado por `decisiones_riego` excede el disponible, debe despacharse un riego parcial de emergencia e insertar un registro en `alertas` con severidad alta.
2.  **Filtrado por Calidad de Datos:** Al calcular promedios o alimentar modelos de ML, la API debe excluir todas las `lecturas_sensor` cuyo `calidad_dato_id` corresponda a valores catalogados como de error o inconsistentes.
3.  **Seguridad de Operadores:** Cualquier cambio sobre la tabla `configuraciones_umbral` o acciones sobre actuadores físicos debe generar inmediatamente una fila en `auditoria_acciones`, capturando la IP remota del cliente (`request.client.host`) en la columna `ip_origen`.