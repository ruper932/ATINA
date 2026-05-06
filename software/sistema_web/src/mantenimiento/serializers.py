from rest_framework import serializers
from .models import CalibracionSensor


class CalibracionSensorSerializer(serializers.ModelSerializer):
    sensor_nombre = serializers.CharField(source="sensor.nombre", read_only=True)
    usuario_username = serializers.CharField(source="usuario.username", read_only=True)

    class Meta:
        model = CalibracionSensor
        fields = [
            "id",
            "sensor",
            "sensor_nombre",
            "tipo_calibracion",
            "valor_anterior",
            "valor_nuevo",
            "motivo",
            "fecha_calibracion",
            "usuario",
            "usuario_username",
        ]