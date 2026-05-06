from django.db import models
from ubicaciones.models import Ubicacion


class Invernadero(models.Model):
    class Estado(models.TextChoices):
        ACTIVO = "activo", "Activo"
        INACTIVO = "inactivo", "Inactivo"
        MANTENIMIENTO = "mantenimiento", "Mantenimiento"

    ubicacion = models.OneToOneField(
        Ubicacion,
        on_delete=models.RESTRICT,
        related_name="invernadero",
    )
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    area_m2 = models.DecimalField(max_digits=10, decimal_places=2)
    prioridad_riego = models.PositiveSmallIntegerField(default=1)
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.ACTIVO,
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "invernaderos"
        verbose_name = "Invernadero"
        verbose_name_plural = "Invernaderos"
        ordering = ["id"]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Atrapaniebla(models.Model):
    class Estado(models.TextChoices):
        ACTIVO = "activo", "Activo"
        INACTIVO = "inactivo", "Inactivo"
        MANTENIMIENTO = "mantenimiento", "Mantenimiento"

    ubicacion = models.OneToOneField(
        Ubicacion,
        on_delete=models.RESTRICT,
        related_name="atrapaniebla",
    )
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=100)
    area_malla_m2 = models.DecimalField(max_digits=10, decimal_places=2)
    tipo_malla = models.CharField(max_length=50, blank=True, null=True)
    orientacion = models.CharField(max_length=30, blank=True, null=True)
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.ACTIVO,
    )
    fecha_instalacion = models.DateField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "atrapanieblas"
        verbose_name = "Atrapaniebla"
        verbose_name_plural = "Atrapanieblas"
        ordering = ["id"]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class FuenteAgua(models.Model):
    class TipoFuente(models.TextChoices):
        ATRAPANIEBLA = "atrapaniebla", "Atrapaniebla"
        MANANTIAL = "manantial", "Manantial"
        TANQUE = "tanque", "Tanque"
        OTRO = "otro", "Otro"

    class Estado(models.TextChoices):
        ACTIVO = "activo", "Activo"
        INACTIVO = "inactivo", "Inactivo"
        MANTENIMIENTO = "mantenimiento", "Mantenimiento"

    ubicacion = models.ForeignKey(
        Ubicacion,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="fuentes_agua",
    )
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=100)
    tipo_fuente = models.CharField(
        max_length=30,
        choices=TipoFuente.choices,
    )
    descripcion = models.TextField(blank=True, null=True)
    capacidad_l = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        blank=True,
        null=True,
    )
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.ACTIVO,
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fuentes_agua"
        verbose_name = "Fuente de agua"
        verbose_name_plural = "Fuentes de agua"
        ordering = ["id"]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"