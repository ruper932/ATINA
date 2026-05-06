from django.conf import settings
from django.db import models
from infraestructura.models import Invernadero
from dispositivos.models import Dispositivo, Sensor
from riego.models import DecisionRiego
from ml.models import SimulacionML3


class Alerta(models.Model):
    class Severidad(models.TextChoices):
        INFO = "info", "Info"
        ADVERTENCIA = "advertencia", "Advertencia"
        ALTA = "alta", "Alta"
        CRITICA = "critica", "Crítica"

    class OrigenAlerta(models.TextChoices):
        ML1 = "ml1", "ML1"
        ML2 = "ml2", "ML2"
        ML3 = "ml3", "ML3"
        SENSOR = "sensor", "Sensor"
        MCP = "mcp", "MCP"
        DASHBOARD = "dashboard", "Dashboard"

    class EstadoAlerta(models.TextChoices):
        ACTIVA = "activa", "Activa"
        RECONOCIDA = "reconocida", "Reconocida"
        RESUELTA = "resuelta", "Resuelta"

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
    severidad = models.CharField(max_length=20, choices=Severidad.choices)
    origen_alerta = models.CharField(max_length=30, choices=OrigenAlerta.choices)
    mensaje = models.TextField()
    estado_alerta = models.CharField(
        max_length=20,
        choices=EstadoAlerta.choices,
        default=EstadoAlerta.ACTIVA,
    )
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
        verbose_name = "Alerta"
        verbose_name_plural = "Alertas"
        ordering = ["-fecha_generacion", "-id"]
        indexes = [
            models.Index(
                fields=["estado_alerta", "-fecha_generacion"],
                name="idx_alertas_est_fecha",
            )
        ]

    def __str__(self):
        return f"{self.tipo_alerta} - {self.severidad} - {self.estado_alerta}"


class NotificacionLocal(models.Model):
    class TipoNotificacion(models.TextChoices):
        LED = "led", "LED"
        BUZZER = "buzzer", "Buzzer"
        PANTALLA = "pantalla", "Pantalla"
        AUDIO = "audio", "Audio"

    class EstadoEnvio(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        ENVIADO = "enviado", "Enviado"
        CONFIRMADO = "confirmado", "Confirmado"
        FALLIDO = "fallido", "Fallido"

    alerta = models.ForeignKey(
        Alerta,
        on_delete=models.CASCADE,
        related_name="notificaciones_locales",
    )
    tipo_notificacion = models.CharField(
        max_length=30,
        choices=TipoNotificacion.choices,
    )
    estado_envio = models.CharField(
        max_length=20,
        choices=EstadoEnvio.choices,
        default=EstadoEnvio.PENDIENTE,
    )
    fecha_envio = models.DateTimeField(blank=True, null=True)
    fecha_confirmacion = models.DateTimeField(blank=True, null=True)
    detalle_respuesta = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "notificaciones_locales"
        verbose_name = "Notificación local"
        verbose_name_plural = "Notificaciones locales"
        ordering = ["-id"]

    def __str__(self):
        return f"{self.alerta_id} - {self.tipo_notificacion} - {self.estado_envio}"