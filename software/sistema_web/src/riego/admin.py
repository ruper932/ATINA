from django.contrib import admin
from .models import DecisionRiego, EstadoRiegoActual


@admin.register(DecisionRiego)
class DecisionRiegoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "invernadero",
        "actuador",
        "fuente_agua",
        "origen_decision",
        "modo_riego",
        "estado_valvula",
        "volumen_disponible_l",
        "demanda_estimada_l",
        "volumen_aplicado_l",
        "ejecutado_en",
    )
    list_filter = ("origen_decision", "modo_riego", "estado_valvula")
    search_fields = (
        "invernadero__codigo",
        "invernadero__nombre",
        "decision_texto",
    )
    ordering = ("-ejecutado_en", "-id")


@admin.register(EstadoRiegoActual)
class EstadoRiegoActualAdmin(admin.ModelAdmin):
    list_display = ("invernadero", "ultima_decision", "actualizado_en")
    search_fields = ("invernadero__codigo", "invernadero__nombre")
    ordering = ("-actualizado_en",)