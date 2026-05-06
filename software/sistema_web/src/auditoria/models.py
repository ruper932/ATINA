from django.conf import settings
from django.db import models


class AuditoriaAccion(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="auditoria_acciones",
    )
    accion = models.CharField(max_length=100)
    entidad_afectada = models.CharField(max_length=100)
    entidad_id = models.BigIntegerField(blank=True, null=True)
    detalle = models.JSONField(blank=True, null=True)
    ip_origen = models.GenericIPAddressField(blank=True, null=True, protocol="both")
    fecha_accion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "auditoria_acciones"
        verbose_name = "Acción de auditoría"
        verbose_name_plural = "Acciones de auditoría"
        ordering = ["-fecha_accion", "-id"]
        indexes = [
            models.Index(
                fields=["entidad_afectada", "-fecha_accion"],
                name="idx_aud_ent_fecha",
            ),
            models.Index(
                fields=["usuario", "-fecha_accion"],
                name="idx_aud_usr_fecha",
            ),
        ]

    def __str__(self):
        return f"{self.accion} - {self.entidad_afectada} - {self.fecha_accion}"