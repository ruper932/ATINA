from django.contrib import admin
from .models import ConfiguracionUmbral


@admin.register(ConfiguracionUmbral)
class ConfiguracionUmbralAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "nombre_parametro",
        "valor",
        "unidad",
        "ambito",
        "invernadero",
        "sensor",
        "editable",
        "actualizado_en",
        "actualizado_por",
    )
    list_filter = ("ambito", "editable")
    search_fields = ("nombre_parametro", "descripcion", "unidad")
    ordering = ("nombre_parametro", "id")