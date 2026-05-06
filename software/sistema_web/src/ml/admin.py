from django.contrib import admin
from .models import PrediccionML1, SimulacionML3


@admin.register(PrediccionML1)
class PrediccionML1Admin(admin.ModelAdmin):
    list_display = (
        "id",
        "fuente_agua",
        "fecha_prediccion",
        "fecha_objetivo",
        "volumen_predicho_l",
        "confianza_modelo",
        "version_modelo",
    )
    list_filter = ("version_modelo", "fuente_agua")
    search_fields = ("fuente_agua__codigo", "fuente_agua__nombre", "version_modelo")
    ordering = ("-fecha_objetivo", "-id")


@admin.register(SimulacionML3)
class SimulacionML3Admin(admin.ModelAdmin):
    list_display = (
        "id",
        "invernadero",
        "fecha_generacion",
        "horizonte_horas",
        "escenario",
        "nivel_riesgo",
        "version_modelo",
    )
    list_filter = ("escenario", "nivel_riesgo", "version_modelo")
    search_fields = ("invernadero__codigo", "invernadero__nombre", "version_modelo")
    ordering = ("-fecha_generacion", "-id")