from django.contrib import admin
from .models import CalibracionSensor


@admin.register(CalibracionSensor)
class CalibracionSensorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "sensor",
        "tipo_calibracion",
        "valor_anterior",
        "valor_nuevo",
        "fecha_calibracion",
        "usuario",
    )
    list_filter = ("tipo_calibracion",)
    search_fields = ("sensor__codigo", "sensor__nombre", "motivo")
    ordering = ("-fecha_calibracion", "-id")