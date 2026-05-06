from django.db import models
from infraestructura.models import Invernadero, FuenteAgua
from dispositivos.models import Actuador


class DecisionRiego(models.Model):
    class OrigenDecision(models.TextChoices):
        ML2 = "ml2", "ML2"
        MANUAL = "manual", "Manual"
        REGLA_SEGURIDAD = "regla_seguridad", "Regla de seguridad"
        TECNICO = "tecnico", "Técnico"
        DOCENTE = "docente", "Docente"

    class ModoRiego(models.TextChoices):
        AUTOMATICO = "automatico", "Automático"
        MANUAL = "manual", "Manual"
        CONTINGENCIA = "contingencia", "Contingencia"

    class EstadoValvula(models.TextChoices):
        ABIERTA = "abierta", "Abierta"
        CERRADA = "cerrada", "Cerrada"
        PARCIAL = "parcial", "Parcial"
        FALLA = "falla", "Falla"

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
    origen_decision = models.CharField(max_length=30, choices=OrigenDecision.choices)
    modo_riego = models.CharField(max_length=20, choices=ModoRiego.choices)
    estado_valvula = models.CharField(max_length=20, choices=EstadoValvula.choices)
    volumen_disponible_l = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    demanda_estimada_l = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    volumen_aplicado_l = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        blank=True,
        null=True,
    )
    decision_texto = models.TextField(blank=True, null=True)
    ejecutado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "decisiones_riego"
        verbose_name = "Decisión de riego"
        verbose_name_plural = "Decisiones de riego"
        ordering = ["-ejecutado_en", "-id"]
        indexes = [
            models.Index(
                fields=["invernadero", "-ejecutado_en"],
                name="idx_dec_riego_inv_fecha",
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
        related_name="estados_riego_actual",
    )
    actualizado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "estado_riego_actual"
        verbose_name = "Estado de riego actual"
        verbose_name_plural = "Estados de riego actual"

    def __str__(self):
        return f"{self.invernadero.codigo} - {self.actualizado_en}"