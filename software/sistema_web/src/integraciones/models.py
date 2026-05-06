from django.db import models
from dispositivos.models import Dispositivo


class SincronizacionMCP(models.Model):
    class EstadoSincronizacion(models.TextChoices):
        EXITO = "exito", "Éxito"
        PARCIAL = "parcial", "Parcial"
        FALLO = "fallo", "Fallo"
        EN_PROCESO = "en_proceso", "En proceso"

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
    estado_sincronizacion = models.CharField(
        max_length=20,
        choices=EstadoSincronizacion.choices,
    )
    cantidad_registros = models.IntegerField(default=0)
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(blank=True, null=True)
    mensaje_resultado = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "sincronizaciones_mcp"
        verbose_name = "Sincronización MCP"
        verbose_name_plural = "Sincronizaciones MCP"
        ordering = ["-fecha_inicio", "-id"]

    def __str__(self):
        return f"{self.origen} -> {self.destino} ({self.estado_sincronizacion})"