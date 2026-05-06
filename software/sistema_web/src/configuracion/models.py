from django.conf import settings
from django.db import models
from django.db.models import Q
from infraestructura.models import Invernadero
from dispositivos.models import Sensor


class ConfiguracionUmbral(models.Model):
    class Ambito(models.TextChoices):
        GLOBAL = "global", "Global"
        INVERNADERO = "invernadero", "Invernadero"
        SENSOR = "sensor", "Sensor"

    nombre_parametro = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    valor = models.DecimalField(max_digits=14, decimal_places=4)
    unidad = models.CharField(max_length=30, blank=True, null=True)
    ambito = models.CharField(
        max_length=30,
        choices=Ambito.choices,
        default=Ambito.GLOBAL,
    )
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
        verbose_name = "Configuración de umbral"
        verbose_name_plural = "Configuraciones de umbral"
        ordering = ["nombre_parametro", "id"]
        constraints = [
            models.CheckConstraint(
                condition=Q(ambito__in=["global", "invernadero", "sensor"]),
                name="chk_umbral_ambito_val",
            ),
            models.CheckConstraint(
                condition=(
                    (
                        Q(ambito="global") &
                        Q(invernadero__isnull=True) &
                        Q(sensor__isnull=True)
                    ) |
                    (
                        Q(ambito="invernadero") &
                        Q(invernadero__isnull=False) &
                        Q(sensor__isnull=True)
                    ) |
                    (
                        Q(ambito="sensor") &
                        Q(sensor__isnull=False)
                    )
                ),
                name="chk_umbral_scope_cfg",
            ),
        ]

    def __str__(self):
        return f"{self.nombre_parametro} - {self.ambito}"