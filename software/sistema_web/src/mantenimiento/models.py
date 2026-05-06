from django.conf import settings
from django.db import models
from dispositivos.models import Sensor


class CalibracionSensor(models.Model):
    sensor = models.ForeignKey(
        Sensor,
        on_delete=models.CASCADE,
        related_name="calibraciones",
    )
    tipo_calibracion = models.CharField(max_length=50)
    valor_anterior = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        blank=True,
        null=True,
    )
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
        verbose_name = "Calibración de sensor"
        verbose_name_plural = "Calibraciones de sensores"
        ordering = ["-fecha_calibracion", "-id"]

    def __str__(self):
        return f"{self.sensor.codigo} - {self.tipo_calibracion} - {self.fecha_calibracion}"