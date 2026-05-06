from django.contrib import admin
from .models import AuditoriaAccion


@admin.register(AuditoriaAccion)
class AuditoriaAccionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "usuario",
        "accion",
        "entidad_afectada",
        "entidad_id",
        "ip_origen",
        "fecha_accion",
    )
    list_filter = ("accion", "entidad_afectada")
    search_fields = ("accion", "entidad_afectada", "detalle")
    ordering = ("-fecha_accion", "-id")