from django.contrib import admin
from .models import PerfilUsuario


@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "ci_documento",
        "telefono",
        "relacion_sistema",
        "cargo_descripcion",
        "creado_en",
    )
    search_fields = (
        "user__username",
        "user__first_name",
        "user__last_name",
        "user__email",
        "ci_documento",
        "telefono",
    )
    list_filter = (
        "relacion_sistema",
        "genero",
        "creado_en",
    )
    readonly_fields = (
        "creado_en",
        "actualizado_en",
    )