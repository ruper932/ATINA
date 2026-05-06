from django.db import models
from ubicaciones.models import Ubicacion
from infraestructura.models import FuenteAgua, Invernadero


class TipoDispositivo(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "tipos_dispositivo"
        verbose_name = "Tipo de dispositivo"
        verbose_name_plural = "Tipos de dispositivo"
        ordering = ["id"]

    def __str__(self):
        return self.nombre


class Dispositivo(models.Model):
    class Estado(models.TextChoices):
        ACTIVO = "activo", "Activo"
        INACTIVO = "inactivo", "Inactivo"
        FALLA = "falla", "Falla"
        MANTENIMIENTO = "mantenimiento", "Mantenimiento"

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
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.ACTIVO,
    )
    ultima_conexion = models.DateTimeField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "dispositivos"
        verbose_name = "Dispositivo"
        verbose_name_plural = "Dispositivos"
        ordering = ["id"]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class TipoSensor(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    variable_medida = models.CharField(max_length=50)
    unidad_base = models.CharField(max_length=30)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "tipos_sensor"
        verbose_name = "Tipo de sensor"
        verbose_name_plural = "Tipos de sensor"
        ordering = ["id"]

    def __str__(self):
        return self.nombre


class Sensor(models.Model):
    class Estado(models.TextChoices):
        ACTIVO = "activo", "Activo"
        INACTIVO = "inactivo", "Inactivo"
        FALLA = "falla", "Falla"
        MANTENIMIENTO = "mantenimiento", "Mantenimiento"

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
    precision_valor = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.ACTIVO,
    )
    fecha_instalacion = models.DateField(blank=True, null=True)

    class Meta:
        db_table = "sensores"
        verbose_name = "Sensor"
        verbose_name_plural = "Sensores"
        ordering = ["id"]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class TipoActuador(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "tipos_actuador"
        verbose_name = "Tipo de actuador"
        verbose_name_plural = "Tipos de actuador"
        ordering = ["id"]

    def __str__(self):
        return self.nombre


class Actuador(models.Model):
    class Estado(models.TextChoices):
        ACTIVO = "activo", "Activo"
        INACTIVO = "inactivo", "Inactivo"
        FALLA = "falla", "Falla"
        MANTENIMIENTO = "mantenimiento", "Mantenimiento"

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
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.ACTIVO,
    )
    fecha_instalacion = models.DateField(blank=True, null=True)

    class Meta:
        db_table = "actuadores"
        verbose_name = "Actuador"
        verbose_name_plural = "Actuadores"
        ordering = ["id"]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"