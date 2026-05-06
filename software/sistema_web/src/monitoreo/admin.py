from django.contrib import admin
from .models import LecturaSensor


@admin.register(LecturaSensor)
class LecturaSensorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "sensor",
        "valor",
        "calidad_dato",
        "timestamp_lectura",
        "timestamp_recepcion",
    )
    list_filter = ("calidad_dato", "sensor__tipo_sensor")
    search_fields = ("sensor__codigo", "sensor__nombre")
    ordering = ("-timestamp_lectura",)