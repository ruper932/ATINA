from django.db import models
from dispositivos.models import Sensor


class LecturaSensor(models.Model):
    class CalidadDato(models.TextChoices):
        VALIDO = "valido", "Válido"
        ESTIMADO = "estimado", "Estimado"
        ATIPICO = "atipico", "Atípico"
        INVALIDO = "invalido", "Inválido"

    sensor = models.ForeignKey(
        Sensor,
        on_delete=models.CASCADE,
        related_name="lecturas",
    )
    valor = models.DecimalField(max_digits=14, decimal_places=4)
    calidad_dato = models.CharField(
        max_length=20,
        choices=CalidadDato.choices,
        default=CalidadDato.VALIDO,
    )
    timestamp_lectura = models.DateTimeField()
    timestamp_recepcion = models.DateTimeField(auto_now_add=True)
    metadatos = models.JSONField(blank=True, null=True)

    class Meta:
        db_table = "lecturas_sensor"
        verbose_name = "Lectura de sensor"
        verbose_name_plural = "Lecturas de sensores"
        ordering = ["-timestamp_lectura"]
        indexes = [
            models.Index(
                fields=["sensor", "-timestamp_lectura"],
                name="idx_lecturas_sensor_sens_fecha",
            )
        ]

    def __str__(self):
        return f"{self.sensor.codigo} - {self.valor} - {self.timestamp_lectura}"