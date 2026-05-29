# Módulo de Solicitudes de Reubicación de Recursos

## Propósito

Este módulo existe para gestionar **solicitudes formales de reubicación** de recursos físicos dentro del sistema, con foco exclusivo en **atrapanieblas** y **fuentes de agua**. La intención no es mover recursos directamente desde una pantalla operativa, sino obligar a que todo cambio de ubicación pase por un flujo de revisión, validación técnica, resolución y trazabilidad completa. [1][2]

En la base actual, ambos recursos ya tienen una relación directa con `ubicaciones` mediante el campo `ubicacionid`, por lo que una aprobación no debe quedarse solo en el estado documental de la solicitud: debe terminar actualizando efectivamente la ubicación real del recurso aprobado. `atrapanieblas` usa `ubicacionid` y `fuentesagua` también usa `ubicacionid`, así que el módulo debe apoyarse en esa estructura existente y no inventar un modelo alterno de ubicación. [1][2]

## Alcance funcional

El alcance del módulo se limita a estos dos tipos de recurso:

- `atrapaniebla`
- `fuenteagua`

No forman parte de este módulo, por ahora, los **invernaderos** ni los **dispositivos**, aunque en el futuro se podría extender el mismo patrón. La decisión de dejar fuera esos recursos simplifica el diseño y evita tener que mezclar en esta primera versión la lógica directa de actualización con la lógica histórica de `dispositivosubicaciones`. [1]

## Contexto del dominio

Dentro del esquema real del proyecto, `atrapanieblas` representa estructuras físicas de captación y `fuentesagua` representa depósitos o reservorios vinculados al manejo hídrico del sistema. Ambos son activos físicos con ubicación explícita dentro del modelo geográfico basado en la tabla `ubicaciones`, que además es jerárquica y sirve como referencia espacial del predio y sus sectores. [1][2]

Eso significa que el módulo no debe entender la ubicación como un simple texto libre final, sino como una transición entre una ubicación oficial de origen y una ubicación oficial de destino. Aun así, el flujo debe permitir que el solicitante proponga una nueva ubicación en texto cuando todavía no exista una fila formal en `ubicaciones`; en ese caso, el técnico debe regularizar primero esa ubicación en el sistema y luego resolver la solicitud con el `ubicacionid` oficial correspondiente. [2]

## Actores y responsabilidades

### Docente solicitante

El docente es quien identifica la necesidad operativa de mover un atrapaniebla o una fuente de agua. Su capacidad termina en **crear** la solicitud y, mientras siga pendiente, **cancelarla**; no puede aprobar, rechazar, reasignar ni actualizar directamente la ubicación física del recurso. [1]

### Técnico o administrador revisor

El técnico o administrador toma la solicitud, la pasa a revisión, evalúa la viabilidad técnica y emite una resolución. En ese momento tiene dos responsabilidades críticas: dejar una observación obligatoria y, si aprueba, garantizar que la solicitud termine aplicando el cambio real de ubicación sobre el recurso correspondiente. Los roles existentes en la base son `docente`, `admin` y `tecnico`, gestionados desde `roles` y vinculados a `users` por `rolid`, por lo que el módulo debe apoyarse en esa estructura para la autorización. [1]

## Objetivo de negocio

El objetivo no es solo “pedir mover algo”, sino crear un proceso **auditable y controlado** para reubicar infraestructura crítica. Cada solicitud debe poder responder, como mínimo, estas preguntas: quién pidió el movimiento, qué recurso quería mover, desde dónde, hacia dónde, por qué motivo, quién revisó el caso, cuál fue la decisión, qué observación la sustenta y cuándo se actualizó la ubicación oficial. [2]

Desde la perspectiva operativa, el valor del módulo aparece cuando la aprobación deja de ser un trámite pasivo y se convierte en una acción consistente: el sistema registra la resolución y actualiza la ubicación real del recurso en la misma operación lógica. Ese punto es clave para evitar que la documentación diga una cosa mientras la infraestructura registrada siga apuntando a otra ubicación. [1]

## Regla crítica de aprobación

La regla más importante del módulo es esta: **si una solicitud es aprobada, la ubicación del recurso debe actualizarse automáticamente**. No basta con marcar la solicitud como aprobada; la aprobación tiene que reflejarse inmediatamente en la infraestructura real registrada en base de datos. [1]

El comportamiento esperado por tipo de recurso es el siguiente:

- Si el recurso es un **atrapaniebla**, al aprobar se actualiza `atrapanieblas.ubicacionid`. [1]
- Si el recurso es una **fuente de agua**, al aprobar se actualiza `fuentesagua.ubicacionid`. [1]

Esa actualización debe ocurrir dentro de la misma transacción lógica que resuelve la solicitud. En otras palabras, el sistema no debe permitir un escenario donde la solicitud quede como aprobada pero la ubicación del recurso no haya cambiado realmente. [1][2]

## Manejo del destino

El destino de una solicitud puede venir en dos formas:

1. **Ubicación existente**: el solicitante ya conoce y selecciona un `ubicacionid` válido.
2. **Ubicación propuesta**: el solicitante describe el nuevo destino en texto porque todavía no existe formalmente en `ubicaciones`.

Cuando el destino es propuesto, esa propuesta no debe convertirse automáticamente en ubicación oficial. El flujo correcto es que el técnico o administrador valide la viabilidad, cree primero la ubicación formal en el sistema si corresponde, y recién entonces apruebe indicando el `ubicacionid` oficial final. Ese diseño evita contaminar la estructura maestra de ubicaciones con texto libre no controlado. [1][2]

## Estados del proceso

El ciclo de vida de la solicitud debe ser simple, explícito y cerrado. Los estados esperados son:

- **Pendiente**: la solicitud fue creada por el docente y todavía nadie la tomó. [1]
- **En revisión**: un técnico o administrador la tomó para estudiar el caso. [1]
- **Aprobada**: la solicitud fue autorizada y el sistema actualizó la ubicación oficial del recurso. [1]
- **Rechazada**: la solicitud fue evaluada y descartada con observación obligatoria. [1]
- **Cancelada**: el docente abortó la solicitud antes de que un revisor la tome. [1]

La transición importante es que **solo una solicitud en revisión** puede ser aprobada o rechazada, y **solo una solicitud pendiente** puede cancelarse. Eso reduce ambigüedades y hace más predecible la auditoría del proceso. [1]

## Datos mínimos que debe guardar una solicitud

Para que el módulo sea útil de verdad, cada solicitud debe conservar al menos estos elementos conceptuales:

- Tipo de recurso: `atrapaniebla` o `fuenteagua`.
- Identificador del recurso afectado.
- Ubicación de origen al momento de crear la solicitud.
- Ubicación de destino oficial, si ya existe.
- Ubicación de destino propuesta en texto, si todavía no existe formalmente.
- Motivo de la solicitud.
- Estado actual del proceso.
- CI del docente solicitante.
- CI del revisor asignado, cuando la solicitud pasa a revisión.
- Observación de resolución, obligatoria tanto para aprobar como para rechazar.
- URL o referencia del PDF técnico, si existe.
- Fechas de creación y actualización. [1]

La clave conceptual aquí es que la **ubicación de origen** debe congelarse al crear la solicitud. Aunque más tarde el recurso pueda cambiar por otro proceso, la solicitud debe reflejar desde qué lugar se pidió mover originalmente. [1]

## Historial y trazabilidad

El módulo debe manejar dos niveles de información:

1. **Cabecera de solicitud**: representa el estado actual consolidado.
2. **Historial**: representa la línea de tiempo de eventos y comentarios.

La cabecera permite consultar rápidamente qué está pasando con la solicitud hoy. El historial permite reconstruir cómo llegó hasta ese punto: creación, toma en revisión, resolución o cancelación. Esto está alineado con el enfoque general del sistema, que ya da importancia a la trazabilidad y a la auditoría de operaciones sensibles. [1][2]

Cada cambio relevante debería dejar una entrada de historial con el estado alcanzado, el usuario que ejecutó la acción, el comentario asociado y, cuando aplique, el archivo vinculado. Esa separación entre “estado actual” e “historial” evita perder contexto cuando una solicitud cambia de fase. [1]

## Resolución técnica

La resolución tiene dos caminos posibles:

### Aprobación

Aprobar significa que el revisor confirma que el traslado es técnicamente viable y autorizado. La aprobación exige observación escrita obligatoria y debería permitir adjuntar un PDF con el estudio técnico, acta o respaldo documental. [2]

Además, aprobar implica una consecuencia operacional inmediata: el sistema debe tomar la ubicación final aprobada y actualizar la tabla real del recurso. Para `atrapanieblas`, el campo a modificar es `ubicacionid`; para `fuentesagua`, también es `ubicacionid`. [1]

### Rechazo

Rechazar significa que el movimiento no es viable, no procede o no fue sustentado adecuadamente. El rechazo también exige observación escrita obligatoria y puede ir acompañado de un PDF con el informe técnico correspondiente. [2]

En el rechazo no se debe tocar la ubicación actual del recurso. Solo cambia el estado documental de la solicitud y se registra la explicación de la decisión. [1]

## Archivos PDF

El PDF no es el centro del modelo, pero sí un respaldo valioso del proceso. Debe considerarse como documentación asociada a la resolución, especialmente en aprobaciones, donde puede contener estudio de campo, verificación de acceso, análisis de caudal, condiciones del terreno o justificación operativa. [2]

Conceptualmente, el módulo no necesita decidir de antemano si el archivo se almacena directamente, si se sube a un storage externo o si se usa una URL prefirmada. Lo importante para cualquier implementación es que la solicitud y su historial puedan guardar una referencia estable al documento resultante. [2]

## Reglas de validación más importantes

Cualquier implementación de este módulo debería respetar estas reglas mínimas:

- Solo un **docente** puede crear solicitudes nuevas. [1]
- Solo un **docente solicitante** puede cancelar su propia solicitud. [1]
- Solo un **técnico** o **administrador** puede tomar una solicitud en revisión. [1]
- Solo un **técnico** o **administrador** puede resolverla. [1]
- No se puede resolver una solicitud que no esté en estado **En revisión**. [1]
- No se puede cancelar una solicitud que ya salió de **Pendiente**. [1]
- Aprobar o rechazar exige **observación escrita obligatoria**. [2]
- Si la solicitud nació con destino propuesto y no con destino oficial, la aprobación debe contar con una **ubicación final oficial** existente en `ubicaciones`. [2][1]
- Si la aprobación falla al actualizar la ubicación real del recurso, la solicitud no debe quedar aprobada. [1]

## Integración con el modelo actual

Este módulo debe vivir como una capa de proceso por encima del modelo físico ya existente. No reemplaza a `atrapanieblas`, `fuentesagua` ni `ubicaciones`; más bien gobierna **cómo** y **cuándo** se permite modificar sus relaciones espaciales oficiales. [1][2]

En otras palabras, `solicitudesmovimiento` y su historial serían tablas de negocio y trazabilidad, mientras que `atrapanieblas.ubicacionid` y `fuentesagua.ubicacionid` seguirían siendo la fuente oficial de la ubicación vigente. La solicitud no compite con ese dato: lo regula. [1]

## Escenario típico

Un docente observa que un atrapaniebla no está captando adecuadamente o que una fuente de agua debe reubicarse por operación, mantenimiento o disponibilidad. Entonces crea una solicitud indicando el recurso, el motivo y un destino existente o propuesto. [2]

Luego un técnico toma la solicitud, hace la evaluación de campo, valida si el nuevo punto existe o debe crearse, y finalmente resuelve. Si aprueba, el sistema registra la resolución y actualiza de inmediato `ubicacionid` del atrapaniebla o de la fuente de agua; si rechaza, solo documenta la decisión sin alterar la infraestructura registrada. [1]

## Criterio de éxito del módulo

El módulo estará conceptualmente bien diseñado si logra tres cosas al mismo tiempo:

- **Control**: nadie mueve recursos sensibles sin revisión. [2]
- **Trazabilidad**: toda decisión queda explicada y reconstruible. [1]
- **Consistencia operativa**: una aprobación cambia la ubicación real del recurso, no solo el papel. [1]

Esa última condición es la más importante. Si una IA que implemente este módulo entiende que “aprobar” debe disparar automáticamente la actualización de `atrapanieblas.ubicacionid` o `fuentesagua.ubicacionid`, entonces ya entendió la idea central del diseño. [1]