from django.db import models
from infraestructura.models import FuenteAgua, Invernadero


class PrediccionML1(models.Model):
    fuente_agua = models.ForeignKey(
        FuenteAgua,
        on_delete=models.CASCADE,
        related_name="predicciones_ml1",
    )
    fecha_prediccion = models.DateField()
    fecha_objetivo = models.DateField()
    volumen_predicho_l = models.DecimalField(max_digits=14, decimal_places=4)
    margen_error = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )
    confianza_modelo = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
    )
    variables_entrada_resumen = models.JSONField(blank=True, null=True)
    version_modelo = models.CharField(max_length=50)
    generado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "predicciones_ml1"
        verbose_name = "Predicción ML1"
        verbose_name_plural = "Predicciones ML1"
        ordering = ["-fecha_objetivo", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["fuente_agua", "fecha_objetivo", "version_modelo"],
                name="uq_pred_ml1_fuente_fecha_ver",
            )
        ]

    def __str__(self):
        return f"{self.fuente_agua.codigo} - {self.fecha_objetivo} - {self.version_modelo}"


class SimulacionML3(models.Model):
    class Escenario(models.TextChoices):
        RIEGO_NORMAL = "riego_normal", "Riego normal"
        RIEGO_RESTRINGIDO = "riego_restringido", "Riego restringido"
        SIN_RIEGO = "sin_riego", "Sin riego"

    class NivelRiesgo(models.TextChoices):
        BAJO = "bajo", "Bajo"
        MEDIO = "medio", "Medio"
        ALTO = "alto", "Alto"
        CRITICO = "critico", "Crítico"

    invernadero = models.ForeignKey(
        Invernadero,
        on_delete=models.CASCADE,
        related_name="simulaciones_ml3",
    )
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    horizonte_horas = models.IntegerField(default=72)
    escenario = models.CharField(max_length=30, choices=Escenario.choices)
    nivel_riesgo = models.CharField(max_length=20, choices=NivelRiesgo.choices)
    descripcion_resultado = models.TextField(blank=True, null=True)
    recomendacion = models.TextField(blank=True, null=True)
    version_modelo = models.CharField(max_length=50)
    generado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "simulaciones_ml3"
        verbose_name = "Simulación ML3"
        verbose_name_plural = "Simulaciones ML3"
        ordering = ["-fecha_generacion", "-id"]
        indexes = [
            models.Index(
                fields=["invernadero", "-fecha_generacion"],
                name="idx_sim_ml3_inv_fecha",
            )
        ]

    def __str__(self):
        return f"{self.invernadero.codigo} - {self.escenario} - {self.nivel_riesgo}"