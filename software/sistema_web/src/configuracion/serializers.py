from rest_framework import serializers
from .models import ConfiguracionUmbral


class ConfiguracionUmbralSerializer(serializers.ModelSerializer):
    invernadero_nombre = serializers.CharField(source="invernadero.nombre", read_only=True)
    sensor_nombre = serializers.CharField(source="sensor.nombre", read_only=True)
    actualizado_por_username = serializers.CharField(source="actualizado_por.username", read_only=True)

    class Meta:
        model = ConfiguracionUmbral
        fields = [
            "id",
            "nombre_parametro",
            "descripcion",
            "valor",
            "unidad",
            "ambito",
            "invernadero",
            "invernadero_nombre",
            "sensor",
            "sensor_nombre",
            "editable",
            "actualizado_en",
            "actualizado_por",
            "actualizado_por_username",
        ]