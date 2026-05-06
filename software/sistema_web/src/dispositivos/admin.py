from django.contrib import admin
from .models import (
    TipoDispositivo,
    Dispositivo,
    TipoSensor,
    Sensor,
    TipoActuador,
    Actuador,
)


@admin.register(TipoDispositivo)
class TipoDispositivoAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "descripcion")
    search_fields = ("nombre",)
    ordering = ("id",)


@admin.register(Dispositivo)
class DispositivoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "codigo",
        "nombre",
        "tipo_dispositivo",
        "ubicacion",
        "fuente_agua",
        "estado",
        "ultima_conexion",
    )
    list_filter = ("estado", "tipo_dispositivo")
    search_fields = ("codigo", "nombre", "identificador_local", "ip_local")
    ordering = ("id",)


@admin.register(TipoSensor)
class TipoSensorAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "variable_medida", "unidad_base")
    search_fields = ("nombre", "variable_medida", "unidad_base")
    ordering = ("id",)


@admin.register(Sensor)
class SensorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "codigo",
        "nombre",
        "dispositivo",
        "tipo_sensor",
        "estado",
        "fecha_instalacion",
    )
    list_filter = ("estado", "tipo_sensor")
    search_fields = ("codigo", "nombre", "modelo", "numero_serie")
    ordering = ("id",)


@admin.register(TipoActuador)
class TipoActuadorAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "descripcion")
    search_fields = ("nombre",)
    ordering = ("id",)


@admin.register(Actuador)
class ActuadorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "codigo",
        "nombre",
        "dispositivo",
        "tipo_actuador",
        "invernadero",
        "estado",
        "fecha_instalacion",
    )
    list_filter = ("estado", "tipo_actuador")
    search_fields = ("codigo", "nombre")
    ordering = ("id",)