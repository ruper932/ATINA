from django.contrib import admin
from .models import SincronizacionMCP


@admin.register(SincronizacionMCP)
class SincronizacionMCPAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "dispositivo",
        "origen",
        "destino",
        "tipo_recurso",
        "estado_sincronizacion",
        "cantidad_registros",
        "fecha_inicio",
        "fecha_fin",
    )
    list_filter = ("estado_sincronizacion", "tipo_recurso")
    search_fields = ("origen", "destino", "tipo_recurso", "mensaje_resultado")
    ordering = ("-fecha_inicio", "-id")