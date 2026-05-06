from django.conf import settings
from django.db import models


class ReporteSemanal(models.Model):
    periodo_inicio = models.DateField()
    periodo_fin = models.DateField()
    volumen_captado_l = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    volumen_predicho_l = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    eficiencia_riego = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        blank=True,
        null=True,
    )
    total_alertas = models.IntegerField(default=0)
    resumen = models.TextField(blank=True, null=True)
    generado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="reportes_generados",
    )
    fecha_generacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reportes_semanales"
        verbose_name = "Reporte semanal"
        verbose_name_plural = "Reportes semanales"
        ordering = ["-periodo_fin", "-id"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(periodo_fin__gte=models.F("periodo_inicio")),
                name="chk_periodo_reporte",
            ),
        ]

    def __str__(self):
        return f"{self.periodo_inicio} - {self.periodo_fin}"