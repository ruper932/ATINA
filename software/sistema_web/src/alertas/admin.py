from django.contrib import admin
from .models import Alerta, NotificacionLocal


@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tipo_alerta",
        "severidad",
        "origen_alerta",
        "estado_alerta",
        "invernadero",
        "dispositivo",
        "sensor",
        "fecha_generacion",
        "usuario_reconoce",
    )
    list_filter = ("severidad", "origen_alerta", "estado_alerta")
    search_fields = ("tipo_alerta", "mensaje")
    ordering = ("-fecha_generacion", "-id")


@admin.register(NotificacionLocal)
class NotificacionLocalAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "alerta",
        "tipo_notificacion",
        "estado_envio",
        "fecha_envio",
        "fecha_confirmacion",
    )
    list_filter = ("tipo_notificacion", "estado_envio")
    search_fields = ("detalle_respuesta",)
    ordering = ("-id",)