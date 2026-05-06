from rest_framework import serializers
from .models import LecturaSensor


class LecturaSensorSerializer(serializers.ModelSerializer):
    sensor_nombre = serializers.CharField(source="sensor.nombre", read_only=True)
    sensor_codigo = serializers.CharField(source="sensor.codigo", read_only=True)

    class Meta:
        model = LecturaSensor
        fields = [
            "id",
            "sensor",
            "sensor_nombre",
            "sensor_codigo",
            "valor",
            "calidad_dato",
            "timestamp_lectura",
            "timestamp_recepcion",
            "metadatos",
        ]

