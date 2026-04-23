from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
import base64
import pickle


class Rol(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "roles"
        verbose_name = "rol"
        verbose_name_plural = "roles"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class PerfilUsuario(models.Model):
    ESTADOS = [
        ("activo", "Activo"),
        ("inactivo", "Inactivo"),
        ("bloqueado", "Bloqueado"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="perfil",
    )
    rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        related_name="perfiles",
    )
    estado = models.CharField(max_length=20, choices=ESTADOS, default="activo")
    face_encoding = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "perfiles_usuario"
        verbose_name = "perfil de usuario"
        verbose_name_plural = "perfiles de usuario"
        ordering = ["user__username"]

    def __str__(self):
        return f"{self.user.username} - {self.rol.nombre}"

    def set_face_encoding(self, encoding):
        self.face_encoding = base64.b64encode(pickle.dumps(encoding)).decode()

    def get_face_encoding(self):
        if self.face_encoding:
            return pickle.loads(base64.b64decode(self.face_encoding))
        return None


class Ubicacion(models.Model):
    TIPOS_UBICACION = [
        ("campus", "Campus"),
        ("sector", "Sector"),
        ("invernadero", "Invernadero"),
        ("atrapaniebla", "Atrapaniebla"),
        ("laboratorio", "Laboratorio"),
        ("fuente_agua", "Fuente de agua"),
    ]

    nombre = models.CharField(max_length=120)
    tipo_ubicacion = models.CharField(max_length=30, choices=TIPOS_UBICACION)
    descripcion = models.TextField(blank=True, null=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="sububicaciones",
        db_column="parent_id",
    )
    latitud = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    altitud_m = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)

    class Meta:
        db_table = "ubicaciones"
        verbose_name = "ubicación"
        verbose_name_plural = "ubicaciones"
        ordering = ["id"]

    def __str__(self):
        return f"{self.nombre} ({self.tipo_ubicacion})"


class Invernadero(models.Model):
    ESTADOS = [
        ("activo", "Activo"),
        ("inactivo", "Inactivo"),
        ("mantenimiento", "Mantenimiento"),
    ]

    ubicacion = models.OneToOneField(
        Ubicacion,
        on_delete=models.PROTECT,
        related_name="invernadero",
    )
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    area_m2 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )
    prioridad_riego = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
    )
    estado = models.CharField(max_length=20, choices=ESTADOS, default="activo")
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "invernaderos"
        verbose_name = "invernadero"
        verbose_name_plural = "invernaderos"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Atrapaniebla(models.Model):
    ESTADOS = [
        ("activo", "Activo"),
        ("inactivo", "Inactivo"),
        ("mantenimiento", "Mantenimiento"),
    ]

    ubicacion = models.OneToOneField(
        Ubicacion,
        on_delete=models.PROTECT,
        related_name="atrapaniebla",
    )
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=100)
    area_malla_m2 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )
    tipo_malla = models.CharField(max_length=50, blank=True, null=True)
    orientacion = models.CharField(max_length=30, blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="activo")
    fecha_instalacion = models.DateField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "atrapanieblas"
        verbose_name = "atrapaniebla"
        verbose_name_plural = "atrapanieblas"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class FuenteAgua(models.Model):
    TIPOS_FUENTE = [
        ("atrapaniebla", "Atrapaniebla"),
        ("manantial", "Manantial"),
        ("tanque", "Tanque"),
        ("otro", "Otro"),
    ]

    ESTADOS = [
        ("activo", "Activo"),
        ("inactivo", "Inactivo"),
        ("mantenimiento", "Mantenimiento"),
    ]

    ubicacion = models.ForeignKey(
        Ubicacion,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="fuentes_agua",
    )
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=100)
    tipo_fuente = models.CharField(max_length=30, choices=TIPOS_FUENTE)
    descripcion = models.TextField(blank=True, null=True)
    capacidad_l = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="activo")
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fuentes_agua"
        verbose_name = "fuente de agua"
        verbose_name_plural = "fuentes de agua"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class TipoDispositivo(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "tipos_dispositivo"
        verbose_name = "tipo de dispositivo"
        verbose_name_plural = "tipos de dispositivo"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Dispositivo(models.Model):
    ESTADOS = [
        ("activo", "Activo"),
        ("inactivo", "Inactivo"),
        ("falla", "Falla"),
        ("mantenimiento", "Mantenimiento"),
    ]

    tipo_dispositivo = models.ForeignKey(
        TipoDispositivo,
        on_delete=models.PROTECT,
        related_name="dispositivos",
    )
    ubicacion = models.ForeignKey(
        Ubicacion,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="dispositivos",
    )
    fuente_agua = models.ForeignKey(
        FuenteAgua,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="dispositivos",
    )
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)
    identificador_local = models.CharField(max_length=100, blank=True, null=True)
    ip_local = models.GenericIPAddressField(blank=True, null=True, protocol="both")
    version_firmware = models.CharField(max_length=50, blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="activo")
    ultima_conexion = models.DateTimeField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "dispositivos"
        verbose_name = "dispositivo"
        verbose_name_plural = "dispositivos"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class TipoSensor(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    variable_medida = models.CharField(max_length=50)
    unidad_base = models.CharField(max_length=30)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "tipos_sensor"
        verbose_name = "tipo de sensor"
        verbose_name_plural = "tipos de sensor"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Sensor(models.Model):
    ESTADOS = [
        ("activo", "Activo"),
        ("inactivo", "Inactivo"),
        ("falla", "Falla"),
        ("mantenimiento", "Mantenimiento"),
    ]

    dispositivo = models.ForeignKey(
        Dispositivo,
        on_delete=models.CASCADE,
        related_name="sensores",
    )
    tipo_sensor = models.ForeignKey(
        TipoSensor,
        on_delete=models.PROTECT,
        related_name="sensores",
    )
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)
    modelo = models.CharField(max_length=50, blank=True, null=True)
    numero_serie = models.CharField(max_length=100, blank=True, null=True)
    precision_valor = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="activo")
    fecha_instalacion = models.DateField(blank=True, null=True)

    class Meta:
        db_table = "sensores"
        verbose_name = "sensor"
        verbose_name_plural = "sensores"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class LecturaSensor(models.Model):
    CALIDADES = [
        ("valido", "Válido"),
        ("estimado", "Estimado"),
        ("atipico", "Atípico"),
        ("invalido", "Inválido"),
    ]

    sensor = models.ForeignKey(
        Sensor,
        on_delete=models.CASCADE,
        related_name="lecturas",
    )
    valor = models.DecimalField(max_digits=14, decimal_places=4)
    calidad_dato = models.CharField(max_length=20, choices=CALIDADES, default="valido")
    timestamp_lectura = models.DateTimeField()
    timestamp_recepcion = models.DateTimeField(auto_now_add=True)
    metadatos = models.JSONField(blank=True, null=True)

    class Meta:
        db_table = "lecturas_sensor"
        verbose_name = "lectura de sensor"
        verbose_name_plural = "lecturas de sensor"
        ordering = ["-timestamp_lectura"]
        indexes = [
            models.Index(
                fields=["sensor", "-timestamp_lectura"],
                name="idx_lect_sensor_f",
            )
        ]

    def __str__(self):
        return f"{self.sensor.codigo} - {self.valor} - {self.timestamp_lectura}"


class TipoActuador(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "tipos_actuador"
        verbose_name = "tipo de actuador"
        verbose_name_plural = "tipos de actuador"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Actuador(models.Model):
    ESTADOS = [
        ("activo", "Activo"),
        ("inactivo", "Inactivo"),
        ("falla", "Falla"),
        ("mantenimiento", "Mantenimiento"),
    ]

    dispositivo = models.ForeignKey(
        Dispositivo,
        on_delete=models.CASCADE,
        related_name="actuadores",
    )
    tipo_actuador = models.ForeignKey(
        TipoActuador,
        on_delete=models.PROTECT,
        related_name="actuadores",
    )
    invernadero = models.ForeignKey(
        Invernadero,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="actuadores",
    )
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="activo")
    fecha_instalacion = models.DateField(blank=True, null=True)

    class Meta:
        db_table = "actuadores"
        verbose_name = "actuador"
        verbose_name_plural = "actuadores"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class PrediccionML1(models.Model):
    fuente_agua = models.ForeignKey(
        FuenteAgua,
        on_delete=models.CASCADE,
        related_name="predicciones_ml1",
    )
    fecha_prediccion = models.DateField()
    fecha_objetivo = models.DateField()
    volumen_predicho_l = models.DecimalField(max_digits=14, decimal_places=4)
    margen_error = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    confianza_modelo = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    variables_entrada_resumen = models.JSONField(blank=True, null=True)
    version_modelo = models.CharField(max_length=50)
    generado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "predicciones_ml1"
        verbose_name = "predicción ML1"
        verbose_name_plural = "predicciones ML1"
        ordering = ["-fecha_objetivo", "-generado_en"]
        constraints = [
            models.UniqueConstraint(
                fields=["fuente_agua", "fecha_objetivo", "version_modelo"],
                name="uq_prediccion_ml1",
            )
        ]

    def __str__(self):
        return f"{self.fuente_agua.codigo} - {self.fecha_objetivo} - {self.version_modelo}"


class DecisionRiego(models.Model):
    ORIGENES = [
        ("ml2", "ML2"),
        ("manual", "Manual"),
        ("regla_seguridad", "Regla de seguridad"),
        ("tecnico", "Técnico"),
        ("docente", "Docente"),
    ]

    MODOS = [
        ("automatico", "Automático"),
        ("manual", "Manual"),
        ("contingencia", "Contingencia"),
    ]

    ESTADOS_VALVULA = [
        ("abierta", "Abierta"),
        ("cerrada", "Cerrada"),
        ("parcial", "Parcial"),
        ("falla", "Falla"),
    ]

    invernadero = models.ForeignKey(
        Invernadero,
        on_delete=models.CASCADE,
        related_name="decisiones_riego",
    )
    actuador = models.ForeignKey(
        Actuador,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="decisiones_riego",
    )
    fuente_agua = models.ForeignKey(
        FuenteAgua,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="decisiones_riego",
    )
    origen_decision = models.CharField(max_length=30, choices=ORIGENES)
    modo_riego = models.CharField(max_length=20, choices=MODOS)
    estado_valvula = models.CharField(max_length=20, choices=ESTADOS_VALVULA)
    volumen_disponible_l = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    demanda_estimada_l = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    volumen_aplicado_l = models.DecimalField(max_digits=14, decimal_places=4, blank=True, null=True)
    decision_texto = models.TextField(blank=True, null=True)
    ejecutado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "decisiones_riego"
        verbose_name = "decisión de riego"
        verbose_name_plural = "decisiones de riego"
        ordering = ["-ejecutado_en"]
        indexes = [
            models.Index(
                fields=["invernadero", "-ejecutado_en"],
                name="idx_dec_riego_inv_f",
            )
        ]

    def __str__(self):
        return f"{self.invernadero.codigo} - {self.modo_riego} - {self.ejecutado_en}"


class EstadoRiegoActual(models.Model):
    invernadero = models.OneToOneField(
        Invernadero,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="estado_riego_actual",
    )
    ultima_decision = models.ForeignKey(
        DecisionRiego,
        on_delete=models.PROTECT,
        related_name="estados_actuales",
    )
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "estado_riego_actual"
        verbose_name = "estado de riego actual"
        verbose_name_plural = "estados de riego actual"

    def __str__(self):
        return f"{self.invernadero.codigo} - {self.actualizado_en}"


class SimulacionML3(models.Model):
    ESCENARIOS = [
        ("riego_normal", "Riego normal"),
        ("riego_restringido", "Riego restringido"),
        ("sin_riego", "Sin riego"),
    ]

    NIVELES_RIESGO = [
        ("bajo", "Bajo"),
        ("medio", "Medio"),
        ("alto", "Alto"),
        ("critico", "Crítico"),
    ]

    invernadero = models.ForeignKey(
        Invernadero,
        on_delete=models.CASCADE,
        related_name="simulaciones_ml3",
    )
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    horizonte_horas = models.PositiveIntegerField(default=72, validators=[MinValueValidator(1)])
    escenario = models.CharField(max_length=30, choices=ESCENARIOS)
    nivel_riesgo = models.CharField(max_length=20, choices=NIVELES_RIESGO)
    descripcion_resultado = models.TextField(blank=True, null=True)
    recomendacion = models.TextField(blank=True, null=True)
    version_modelo = models.CharField(max_length=50)
    generado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "simulaciones_ml3"
        verbose_name = "simulación ML3"
        verbose_name_plural = "simulaciones ML3"
        ordering = ["-fecha_generacion"]
        indexes = [
            models.Index(
                fields=["invernadero", "-fecha_generacion"],
                name="idx_sim_ml3_inv_f",
            )
        ]

    def __str__(self):
        return f"{self.invernadero.codigo} - {self.escenario} - {self.nivel_riesgo}"


class Alerta(models.Model):
    SEVERIDADES = [
        ("info", "Info"),
        ("advertencia", "Advertencia"),
        ("alta", "Alta"),
        ("critica", "Crítica"),
    ]

    ORIGENES = [
        ("ml1", "ML1"),
        ("ml2", "ML2"),
        ("ml3", "ML3"),
        ("sensor", "Sensor"),
        ("mcp", "MCP"),
        ("dashboard", "Dashboard"),
    ]

    ESTADOS = [
        ("activa", "Activa"),
        ("reconocida", "Reconocida"),
        ("resuelta", "Resuelta"),
    ]

    invernadero = models.ForeignKey(
        Invernadero,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="alertas",
    )
    dispositivo = models.ForeignKey(
        Dispositivo,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="alertas",
    )
    sensor = models.ForeignKey(
        Sensor,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="alertas",
    )
    decision_riego = models.ForeignKey(
        DecisionRiego,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="alertas",
    )
    simulacion_ml3 = models.ForeignKey(
        SimulacionML3,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="alertas",
    )
    tipo_alerta = models.CharField(max_length=50)
    severidad = models.CharField(max_length=20, choices=SEVERIDADES)
    origen_alerta = models.CharField(max_length=30, choices=ORIGENES)
    mensaje = models.TextField()
    estado_alerta = models.CharField(max_length=20, choices=ESTADOS, default="activa")
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    fecha_reconocimiento = models.DateTimeField(blank=True, null=True)
    usuario_reconoce = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="alertas_reconocidas",
    )

    class Meta:
        db_table = "alertas"
        verbose_name = "alerta"
        verbose_name_plural = "alertas"
        ordering = ["-fecha_generacion"]
        indexes = [
            models.Index(
                fields=["estado_alerta", "-fecha_generacion"],
                name="idx_alertas_estado_fecha",
            )
        ]

    def __str__(self):
        return f"{self.tipo_alerta} - {self.severidad} - {self.estado_alerta}"


class NotificacionLocal(models.Model):
    TIPOS = [
        ("led", "LED"),
        ("buzzer", "Buzzer"),
        ("pantalla", "Pantalla"),
        ("audio", "Audio"),
    ]

    ESTADOS_ENVIO = [
        ("pendiente", "Pendiente"),
        ("enviado", "Enviado"),
        ("confirmado", "Confirmado"),
        ("fallido", "Fallido"),
    ]

    alerta = models.ForeignKey(
        Alerta,
        on_delete=models.CASCADE,
        related_name="notificaciones_locales",
    )
    tipo_notificacion = models.CharField(max_length=30, choices=TIPOS)
    estado_envio = models.CharField(max_length=20, choices=ESTADOS_ENVIO, default="pendiente")
    fecha_envio = models.DateTimeField(blank=True, null=True)
    fecha_confirmacion = models.DateTimeField(blank=True, null=True)
    detalle_respuesta = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "notificaciones_locales"
        verbose_name = "notificación local"
        verbose_name_plural = "notificaciones locales"
        ordering = ["-id"]

    def __str__(self):
        return f"{self.alerta_id} - {self.tipo_notificacion} - {self.estado_envio}"


class ConfiguracionUmbral(models.Model):
    AMBITOS = [
        ("global", "Global"),
        ("invernadero", "Invernadero"),
        ("sensor", "Sensor"),
    ]

    nombre_parametro = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    valor = models.DecimalField(max_digits=14, decimal_places=4)
    unidad = models.CharField(max_length=30, blank=True, null=True)
    ambito = models.CharField(max_length=30, choices=AMBITOS, default="global")
    invernadero = models.ForeignKey(
        Invernadero,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="configuraciones_umbral",
    )
    sensor = models.ForeignKey(
        Sensor,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="configuraciones_umbral",
    )
    editable = models.BooleanField(default=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    actualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="umbrales_actualizados",
    )

    class Meta:
        db_table = "configuraciones_umbral"
        verbose_name = "configuración de umbral"
        verbose_name_plural = "configuraciones de umbral"
        ordering = ["nombre_parametro", "ambito"]

    def __str__(self):
        return f"{self.nombre_parametro} - {self.ambito}"

    def clean(self):
        super().clean()
        if self.ambito == "global":
            if self.invernadero_id is not None or self.sensor_id is not None:
                raise ValidationError("Para ámbito global no debe existir invernadero ni sensor.")
        elif self.ambito == "invernadero":
            if self.invernadero_id is None or self.sensor_id is not None:
                raise ValidationError("Para ámbito invernadero debe existir invernadero y no sensor.")
        elif self.ambito == "sensor":
            if self.sensor_id is None:
                raise ValidationError("Para ámbito sensor debe existir sensor.")


class CalibracionSensor(models.Model):
    sensor = models.ForeignKey(
        Sensor,
        on_delete=models.CASCADE,
        related_name="calibraciones",
    )
    tipo_calibracion = models.CharField(max_length=50)
    valor_anterior = models.DecimalField(max_digits=14, decimal_places=4, blank=True, null=True)
    valor_nuevo = models.DecimalField(max_digits=14, decimal_places=4)
    motivo = models.TextField(blank=True, null=True)
    fecha_calibracion = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="calibraciones_sensor",
    )

    class Meta:
        db_table = "calibraciones_sensor"
        verbose_name = "calibración de sensor"
        verbose_name_plural = "calibraciones de sensor"
        ordering = ["-fecha_calibracion"]

    def __str__(self):
        return f"{self.sensor.codigo} - {self.tipo_calibracion}"


class SincronizacionMCP(models.Model):
    ESTADOS = [
        ("exito", "Éxito"),
        ("parcial", "Parcial"),
        ("fallo", "Fallo"),
        ("en_proceso", "En proceso"),
    ]

    dispositivo = models.ForeignKey(
        Dispositivo,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="sincronizaciones_mcp",
    )
    origen = models.CharField(max_length=50)
    destino = models.CharField(max_length=50)
    tipo_recurso = models.CharField(max_length=50)
    estado_sincronizacion = models.CharField(max_length=20, choices=ESTADOS)
    cantidad_registros = models.IntegerField(default=0)
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(blank=True, null=True)
    mensaje_resultado = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "sincronizaciones_mcp"
        verbose_name = "sincronización MCP"
        verbose_name_plural = "sincronizaciones MCP"
        ordering = ["-fecha_inicio"]

    def __str__(self):
        return f"{self.origen} -> {self.destino} ({self.estado_sincronizacion})"


class AuditoriaAccion(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="auditorias_accion",
    )
    accion = models.CharField(max_length=100)
    entidad_afectada = models.CharField(max_length=100)
    entidad_id = models.BigIntegerField(blank=True, null=True)
    detalle = models.JSONField(blank=True, null=True)
    ip_origen = models.GenericIPAddressField(blank=True, null=True, protocol="both")
    fecha_accion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "auditoria_acciones"
        verbose_name = "auditoría de acción"
        verbose_name_plural = "auditorías de acciones"
        ordering = ["-fecha_accion"]

    def __str__(self):
        return f"{self.accion} - {self.entidad_afectada}"


class ReporteSemanal(models.Model):
    periodo_inicio = models.DateField()
    periodo_fin = models.DateField()
    volumen_captado_l = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    volumen_predicho_l = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    eficiencia_riego = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    total_alertas = models.IntegerField(default=0)
    resumen = models.TextField(blank=True, null=True)
    generado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="reportes_semanales_generados",
    )
    fecha_generacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reportes_semanales"
        verbose_name = "reporte semanal"
        verbose_name_plural = "reportes semanales"
        ordering = ["-fecha_generacion"]

    def __str__(self):
        return f"{self.periodo_inicio} a {self.periodo_fin}"

    def clean(self):
        super().clean()
        if self.periodo_fin < self.periodo_inicio:
            raise ValidationError("El periodo_fin no puede ser menor a periodo_inicio.")


class VwLecturaDetallada(models.Model):
    lectura_id = models.BigAutoField(primary_key=True)
    timestamp_lectura = models.DateTimeField()
    timestamp_recepcion = models.DateTimeField()
    valor = models.DecimalField(max_digits=14, decimal_places=4)
    calidad_dato = models.CharField(max_length=20)
    sensor_id = models.BigIntegerField()
    sensor_codigo = models.CharField(max_length=50)
    sensor_nombre = models.CharField(max_length=100)
    tipo_sensor = models.CharField(max_length=50)
    variable_medida = models.CharField(max_length=50)
    unidad_base = models.CharField(max_length=30)
    dispositivo_id = models.BigIntegerField()
    dispositivo_codigo = models.CharField(max_length=50)
    dispositivo_nombre = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = "vw_lecturas_detalladas"
        verbose_name = "vista de lectura detallada"
        verbose_name_plural = "vistas de lecturas detalladas"

    def __str__(self):
        return f"{self.sensor_codigo} - {self.timestamp_lectura}"


class VwDecisionRiegoDetallada(models.Model):
    decision_id = models.BigAutoField(primary_key=True)
    ejecutado_en = models.DateTimeField()
    origen_decision = models.CharField(max_length=30)
    modo_riego = models.CharField(max_length=20)
    estado_valvula = models.CharField(max_length=20)
    volumen_disponible_l = models.DecimalField(max_digits=14, decimal_places=4)
    demanda_estimada_l = models.DecimalField(max_digits=14, decimal_places=4)
    volumen_aplicado_l = models.DecimalField(max_digits=14, decimal_places=4, blank=True, null=True)
    invernadero_codigo = models.CharField(max_length=30)
    invernadero_nombre = models.CharField(max_length=100)
    fuente_codigo = models.CharField(max_length=30, blank=True, null=True)
    fuente_nombre = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "vw_decisiones_riego_detalladas"
        verbose_name = "vista de decisión de riego"
        verbose_name_plural = "vistas de decisiones de riego"

    def __str__(self):
        return f"{self.invernadero_codigo} - {self.ejecutado_en}"


class VwAlertaOperativa(models.Model):
    alerta_id = models.BigAutoField(primary_key=True)
    tipo_alerta = models.CharField(max_length=50)
    severidad = models.CharField(max_length=20)
    origen_alerta = models.CharField(max_length=30)
    estado_alerta = models.CharField(max_length=20)
    fecha_generacion = models.DateTimeField()
    invernadero_codigo = models.CharField(max_length=30, blank=True, null=True)
    dispositivo_codigo = models.CharField(max_length=50, blank=True, null=True)
    sensor_codigo = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "vw_alertas_operativas"
        verbose_name = "vista de alerta operativa"
        verbose_name_plural = "vistas de alertas operativas"

    def __str__(self):
        return f"{self.tipo_alerta} - {self.estado_alerta}"


# --------------------- Reportes ---------------------------
class VwReporteInvernaderosUbicacion(models.Model):
    id = models.BigIntegerField(primary_key=True)
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=100)
    area_m2 = models.DecimalField(max_digits=10, decimal_places=2)
    prioridad_riego = models.SmallIntegerField()
    estado = models.CharField(max_length=20)
    ubicacion_nombre = models.CharField(max_length=120)
    tipo_ubicacion = models.CharField(max_length=30)
    altitud_m = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "vw_reporte_invernaderos_ubicacion"
        verbose_name = "reporte invernadero-ubicación"
        verbose_name_plural = "reportes invernadero-ubicación"

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class VwReporteSensoresTipo(models.Model):
    id = models.BigIntegerField(primary_key=True)
    codigo = models.CharField(max_length=50)
    nombre = models.CharField(max_length=100)
    estado = models.CharField(max_length=20)
    modelo = models.CharField(max_length=50, null=True, blank=True)
    numero_serie = models.CharField(max_length=100, null=True, blank=True)
    tipo_sensor_nombre = models.CharField(max_length=50)
    variable_medida = models.CharField(max_length=50)
    unidad_base = models.CharField(max_length=30)

    class Meta:
        managed = False
        db_table = "vw_reporte_sensores_tipo"
        verbose_name = "reporte sensor-tipo"
        verbose_name_plural = "reportes sensor-tipo"

    def __str__(self):
        return f"{self.codigo} - {self.tipo_sensor_nombre}"


class VwReporteFuentesUbicacion(models.Model):
    id = models.BigIntegerField(primary_key=True)
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=100)
    tipo_fuente = models.CharField(max_length=30)
    capacidad_l = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    estado = models.CharField(max_length=20)
    ubicacion_nombre = models.CharField(max_length=120, null=True, blank=True)
    tipo_ubicacion = models.CharField(max_length=30, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "vw_reporte_fuentes_ubicacion"
        verbose_name = "reporte fuente-ubicación"
        verbose_name_plural = "reportes fuente-ubicación"

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class VwReporteLecturasSensorTipo(models.Model):
    id = models.BigIntegerField(primary_key=True)
    timestamp_lectura = models.DateTimeField()
    timestamp_recepcion = models.DateTimeField()
    valor = models.DecimalField(max_digits=14, decimal_places=4)
    calidad_dato = models.CharField(max_length=20)
    sensor_codigo = models.CharField(max_length=50)
    sensor_nombre = models.CharField(max_length=100)
    tipo_sensor_nombre = models.CharField(max_length=50)
    variable_medida = models.CharField(max_length=50)
    unidad_base = models.CharField(max_length=30)

    class Meta:
        managed = False
        db_table = "vw_reporte_lecturas_sensor_tipo"
        verbose_name = "reporte lectura-sensor-tipo"
        verbose_name_plural = "reportes lectura-sensor-tipo"

    def __str__(self):
        return f"{self.sensor_codigo} - {self.timestamp_lectura}"


class VwReporteDecisionesInvernaderoFuente(models.Model):
    id = models.BigIntegerField(primary_key=True)
    ejecutado_en = models.DateTimeField()
    origen_decision = models.CharField(max_length=30)
    modo_riego = models.CharField(max_length=20)
    estado_valvula = models.CharField(max_length=20)
    volumen_disponible_l = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    demanda_estimada_l = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    volumen_aplicado_l = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    invernadero_codigo = models.CharField(max_length=30)
    invernadero_nombre = models.CharField(max_length=100)
    fuente_codigo = models.CharField(max_length=30, null=True, blank=True)
    fuente_nombre = models.CharField(max_length=100, null=True, blank=True)
    tipo_fuente = models.CharField(max_length=30, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "vw_reporte_decisiones_invernadero_fuente"
        verbose_name = "reporte decisión-invernadero-fuente"
        verbose_name_plural = "reportes decisión-invernadero-fuente"

    def __str__(self):
        return f"{self.invernadero_codigo} - {self.ejecutado_en}"