from rest_framework import serializers
from .models import AuditoriaAccion


class AuditoriaAccionSerializer(serializers.ModelSerializer):
    usuario_username = serializers.CharField(source="usuario.username", read_only=True)

    class Meta:
        model = AuditoriaAccion
        fields = [
            "id",
            "usuario",
            "usuario_username",
            "accion",
            "entidad_afectada",
            "entidad_id",
            "detalle",
            "ip_origen",
            "fecha_accion",
        ]