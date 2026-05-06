from django.contrib import admin
from .models import Ubicacion


@admin.register(Ubicacion)
class UbicacionAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "tipo_ubicacion", "parent", "altitud_m")
    list_filter = ("tipo_ubicacion",)
    search_fields = ("nombre", "descripcion")
    ordering = ("id",)