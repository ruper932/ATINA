from django.contrib import admin
from .models import ReporteSemanal


@admin.register(ReporteSemanal)
class ReporteSemanalAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "periodo_inicio",
        "periodo_fin",
        "volumen_captado_l",
        "volumen_predicho_l",
        "eficiencia_riego",
        "total_alertas",
        "generado_por",
        "fecha_generacion",
    )
    list_filter = ("periodo_inicio", "periodo_fin")
    search_fields = ("resumen",)
    ordering = ("-periodo_fin", "-id")