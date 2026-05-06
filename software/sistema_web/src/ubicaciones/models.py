from django.db import models


class Ubicacion(models.Model):
    class TipoUbicacion(models.TextChoices):
        CAMPUS = "campus", "Campus"
        SECTOR = "sector", "Sector"
        INVERNADERO = "invernadero", "Invernadero"
        ATRAPANIEBLA = "atrapaniebla", "Atrapaniebla"
        LABORATORIO = "laboratorio", "Laboratorio"
        FUENTE_AGUA = "fuente_agua", "Fuente de agua"

    nombre = models.CharField(max_length=120)
    tipo_ubicacion = models.CharField(
        max_length=30,
        choices=TipoUbicacion.choices,
    )
    descripcion = models.TextField(blank=True, null=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="sububicaciones",
    )
    latitud = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True,
    )
    longitud = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True,
    )
    altitud_m = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "ubicaciones"
        verbose_name = "Ubicación"
        verbose_name_plural = "Ubicaciones"
        ordering = ["id"]

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_ubicacion_display()})"