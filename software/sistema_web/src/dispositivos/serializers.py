from rest_framework import serializers
from .models import TipoDispositivo, Dispositivo, TipoSensor, Sensor, TipoActuador, Actuador


class TipoDispositivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoDispositivo
        fields = ["id", "nombre", "descripcion"]


class DispositivoSerializer(serializers.ModelSerializer):
    tipo_dispositivo_nombre = serializers.CharField(source="tipo_dispositivo.nombre", read_only=True)
    ubicacion_nombre = serializers.CharField(source="ubicacion.nombre", read_only=True)
    fuente_agua_nombre = serializers.CharField(source="fuente_agua.nombre", read_only=True)

    class Meta:
        model = Dispositivo
        fields = [
            "id",
            "tipo_dispositivo",
            "tipo_dispositivo_nombre",
            "ubicacion",
            "ubicacion_nombre",
            "fuente_agua",
            "fuente_agua_nombre",
            "codigo",
            "nombre",
            "identificador_local",
            "ip_local",
            "version_firmware",
            "estado",
            "ultima_conexion",
            "creado_en",
        ]


class TipoSensorSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoSensor
        fields = ["id", "nombre", "variable_medida", "unidad_base", "descripcion"]


class SensorSerializer(serializers.ModelSerializer):
    dispositivo_nombre = serializers.CharField(source="dispositivo.nombre", read_only=True)
    tipo_sensor_nombre = serializers.CharField(source="tipo_sensor.nombre", read_only=True)

    class Meta:
        model = Sensor
        fields = [
            "id",
            "dispositivo",
            "dispositivo_nombre",
            "tipo_sensor",
            "tipo_sensor_nombre",
            "codigo",
            "nombre",
            "modelo",
            "numero_serie",
            "precision_valor",
            "estado",
            "fecha_instalacion",
        ]


class TipoActuadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoActuador
        fields = ["id", "nombre", "descripcion"]


class ActuadorSerializer(serializers.ModelSerializer):
    dispositivo_nombre = serializers.CharField(source="dispositivo.nombre", read_only=True)
    tipo_actuador_nombre = serializers.CharField(source="tipo_actuador.nombre", read_only=True)
    invernadero_nombre = serializers.CharField(source="invernadero.nombre", read_only=True)

    class Meta:
        model = Actuador
        fields = [
            "id",
            "dispositivo",
            "dispositivo_nombre",
            "tipo_actuador",
            "tipo_actuador_nombre",
            "invernadero",
            "invernadero_nombre",
            "codigo",
            "nombre",
            "estado",
            "fecha_instalacion",
        ]