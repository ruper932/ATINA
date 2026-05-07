Perfecto. A continuación te entrego **todos los diagramas de casos de uso** de tu sistema inteligente de agua (atrapanieblas + IoT + ML + MCP + dashboard), **uno por uno**, en formato **PlantUML** con estilo profesional (actor, rectángulo de sistema, elipses). Cada diagrama incluye su código y su tabla descriptiva.

---

## 1. Diagrama de Casos de Uso: Captación de Niebla

**Código PlantUML:**

```plantuml
@startuml
title Captación de Niebla

actor "Técnico de Riego" as tecnico
actor "Sistema IoT (Sensor)" as sensor

rectangle "Captación de Niebla" {
  usecase "Registrar datos de caudal" as UC1
  usecase "Configurar parámetros de malla" as UC2
  usecase "Monitorear nivel de captación" as UC3
}

sensor --> UC1
tecnico --> UC1
tecnico --> UC2
tecnico --> UC3
@enduml
```

**Tabla descriptiva:**

| Elemento | Descripción |
|----------|-------------|
| **Nombre** | Captación de Niebla |
| **Actores** | Técnico de Riego, Sistema IoT (caudalímetro) |
| **Propósito** | Registrar y visualizar los datos de captación de agua de los atrapanieblas |
| **Descripción** | El sensor caudalímetro envía automáticamente los litros captados al servidor MCP. El técnico puede configurar parámetros de la malla (área, orientación) y consultar en tiempo real el nivel de captación. |

---

## 2. Diagrama de Casos de Uso: Estación Meteorológica IoT

**Código PlantUML:**

```plantuml
@startuml
title Estación Meteorológica IoT

actor "Técnico de Riego" as tecnico
actor "Sistema IoT (BME680)" as sensor

rectangle "Estación IoT" {
  usecase "Registrar temperatura" as UC1
  usecase "Registrar presión atmosférica" as UC2
  usecase "Registrar humedad relativa" as UC3
  usecase "Visualizar datos en tiempo real" as UC4
}

sensor --> UC1
sensor --> UC2
sensor --> UC3
tecnico --> UC4
@enduml
```

**Tabla descriptiva:**

| Elemento | Descripción |
|----------|-------------|
| **Nombre** | Estación Meteorológica IoT |
| **Actores** | Sistema IoT (sensor BME680), Técnico de Riego |
| **Propósito** | Recolectar datos ambientales (temperatura, presión, humedad) para alimentar los modelos ML |
| **Descripción** | El sensor BME680 envía lecturas cada 10 minutos al servidor local vía MCP. El técnico visualiza las variables en el dashboard. |

---

## 3. Diagrama de Casos de Uso: Modelos de Machine Learning (ML1, ML2, ML3)

**Código PlantUML:**

```plantuml
@startuml
title Modelos de Machine Learning

actor "Técnico de Riego" as tecnico
actor "Sistema MCP" as mcp

rectangle "Modelos ML" {
  usecase "Predecir volumen diario de agua (ML1)" as UC1
  usecase "Calcular riego óptimo en edge (ML2)" as UC2
  usecase "Simular escenarios de disponibilidad (ML3)" as UC3
}

tecnico --> UC1
mcp --> UC2
tecnico --> UC3
@enduml
```

**Tabla descriptiva:**

| Elemento | Descripción |
|----------|-------------|
| **Nombre** | Modelos de Machine Learning |
| **Actores** | Técnico de Riego, Sistema MCP (servidor de interoperabilidad) |
| **Propósito** | Generar predicciones, control autónomo de riego en el borde y simulaciones prospectivas |
| **Descripción** | ML1 predice el volumen diario de agua captada usando datos históricos. ML2, ejecutándose en el ESP32, calcula la cantidad exacta de riego para los invernaderos. ML3 permite al técnico simular escenarios (ej. "si no llueve por 5 días, ¿cuánta agua tendré?"). |

---

## 4. Diagrama de Casos de Uso: Dashboard Web

**Código PlantUML:**

```plantuml
@startuml
title Dashboard Web

actor "Técnico de Riego" as tecnico
actor "Estudiante / Docente" as estudiante

rectangle "Dashboard React" {
  usecase "Visualizar datos de sensores" as UC1
  usecase "Ver predicciones ML1" as UC2
  usecase "Controlar riego manual/automático" as UC3
  usecase "Generar reportes de alerta" as UC4
}

tecnico --> UC1
tecnico --> UC2
tecnico --> UC3
tecnico --> UC4
estudiante --> UC1
estudiante --> UC2
@enduml
```

**Tabla descriptiva:**

| Elemento | Descripción |
|----------|-------------|
| **Nombre** | Dashboard Web |
| **Actores** | Técnico de Riego, Estudiante / Docente |
| **Propósito** | Visualizar toda la información del sistema en una interfaz amigable |
| **Descripción** | El técnico puede ver gráficos de caudal, recibir alertas de escasez, activar el riego manualmente o dejar que ML2 lo haga automático. Los estudiantes pueden explorar los datos históricos y predicciones con fines educativos. |

---

## 5. Diagrama de Casos de Uso: Administración del Sistema

**Código PlantUML:**

```plantuml
@startuml
title Administración del Sistema

actor "Administrador" as admin

rectangle "Administración" {
  usecase "Gestionar usuarios (técnicos, estudiantes)" as UC1
  usecase "Revisar bitácora de eventos" as UC2
  usecase "Realizar copias de seguridad" as UC3
  usecase "Restaurar base de datos" as UC4
}

admin --> UC1
admin --> UC2
admin --> UC3
admin --> UC4
@enduml
```

**Tabla descriptiva:**

| Elemento | Descripción |
|----------|-------------|
| **Nombre** | Administración del Sistema |
| **Actores** | Administrador |
| **Propósito** | Asegurar el correcto funcionamiento y seguridad del sistema |
| **Descripción** | El administrador registra técnicos y estudiantes, asigna roles, revisa los logs de acciones (quién activó el riego, etc.), y programa backups automáticos de la base de datos PostgreSQL. |

---

## 6. Diagrama General de Casos de Uso (integrados)

Si quieres un solo diagrama que muestre todos los módulos y sus relaciones con los actores, usa este código:

```plantuml
@startuml
title Sistema Inteligente de Agua - Casos de Uso Generales

actor "Técnico de Riego" as tecnico
actor "Estudiante/Docente" as estudiante
actor "Administrador" as admin
actor "Sensor IoT" as sensor
actor "Sistema MCP" as mcp

rectangle "Sistema Inteligente de Agua" {
  rectangle "Captación de Niebla" {
    usecase "Registrar caudal" as UC1
    usecase "Configurar malla" as UC2
  }
  rectangle "Estación IoT" {
    usecase "Registrar temp/presión/humedad" as UC3
  }
  rectangle "Modelos ML" {
    usecase "Predecir volumen (ML1)" as UC4
    usecase "Calcular riego edge (ML2)" as UC5
    usecase "Simular escenarios (ML3)" as UC6
  }
  rectangle "Dashboard" {
    usecase "Visualizar datos" as UC7
    usecase "Controlar riego" as UC8
  }
  rectangle "Administración" {
    usecase "Gestionar usuarios" as UC9
    usecase "Ver bitácora" as UC10
  }
}

sensor --> UC1
sensor --> UC3
tecnico --> UC2
tecnico --> UC4
tecnico --> UC6
tecnico --> UC7
tecnico --> UC8
mcp --> UC5
estudiante --> UC7
estudiante --> UC4
admin --> UC9
admin --> UC10
@enduml
```

---

## Cómo generar los diagramas

1. Copia el código de cada diagrama (desde `@startuml` hasta `@enduml`).
2. Ve a [PlantUML Web Server](https://www.plantuml.com/plantuml/uml/) o usa la extensión de VS Code.
3. Pega el código y obtendrás la imagen PNG/SVG.
4. Inserta cada imagen en tu documento de Word/LaTeX con su respectiva tabla.

¿Necesitas que modifique algún actor, agregue relaciones `<<extend>>` o `<<include>>`, o que ajuste la descripción?