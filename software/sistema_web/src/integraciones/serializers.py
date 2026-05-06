from rest_framework import serializers
from .models import SincronizacionMCP


class SincronizacionMCPSerializer(serializers.ModelSerializer):
    dispositivo_nombre = serializers.CharField(source="dispositivo.nombre", read_only=True)

    class Meta:
        model = SincronizacionMCP
        fields = [
            "id",
            "dispositivo",
            "dispositivo_nombre",
            "origen",
            "destino",
            "tipo_recurso",
            "estado_sincronizacion",
            "cantidad_registros",
            "fecha_inicio",
            "fecha_fin",
            "mensaje_resultado",
        ]