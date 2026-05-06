from django.contrib import admin
from .models import Invernadero, Atrapaniebla, FuenteAgua


@admin.register(Invernadero)
class InvernaderoAdmin(admin.ModelAdmin):
    list_display = ("id", "codigo", "nombre", "ubicacion", "area_m2", "prioridad_riego", "estado")
    list_filter = ("estado",)
    search_fields = ("codigo", "nombre", "descripcion")
    ordering = ("id",)


@admin.register(Atrapaniebla)
class AtrapanieblaAdmin(admin.ModelAdmin):
    list_display = ("id", "codigo", "nombre", "ubicacion", "area_malla_m2", "orientacion", "estado")
    list_filter = ("estado", "tipo_malla", "orientacion")
    search_fields = ("codigo", "nombre", "tipo_malla")
    ordering = ("id",)


@admin.register(FuenteAgua)
class FuenteAguaAdmin(admin.ModelAdmin):
    list_display = ("id", "codigo", "nombre", "tipo_fuente", "ubicacion", "capacidad_l", "estado")
    list_filter = ("tipo_fuente", "estado")
    search_fields = ("codigo", "nombre", "descripcion")
    ordering = ("id",)