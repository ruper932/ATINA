from rest_framework import serializers
from .models import Alerta, NotificacionLocal


class AlertaSerializer(serializers.ModelSerializer):
    invernadero_nombre = serializers.CharField(source="invernadero.nombre", read_only=True)
    dispositivo_nombre = serializers.CharField(source="dispositivo.nombre", read_only=True)
    sensor_nombre = serializers.CharField(source="sensor.nombre", read_only=True)
    decision_riego_texto = serializers.CharField(source="decision_riego.decision_texto", read_only=True)
    simulacion_ml3_escenario = serializers.CharField(source="simulacion_ml3.escenario", read_only=True)
    usuario_reconoce_username = serializers.CharField(source="usuario_reconoce.username", read_only=True)

    class Meta:
        model = Alerta
        fields = [
            "id",
            "invernadero",
            "invernadero_nombre",
            "dispositivo",
            "dispositivo_nombre",
            "sensor",
            "sensor_nombre",
            "decision_riego",
            "decision_riego_texto",
            "simulacion_ml3",
            "simulacion_ml3_escenario",
            "tipo_alerta",
            "severidad",
            "origen_alerta",
            "mensaje",
            "estado_alerta",
            "fecha_generacion",
            "fecha_reconocimiento",
            "usuario_reconoce",
            "usuario_reconoce_username",
        ]


class NotificacionLocalSerializer(serializers.ModelSerializer):
    alerta_tipo = serializers.CharField(source="alerta.tipo_alerta", read_only=True)

    class Meta:
        model = NotificacionLocal
        fields = [
            "id",
            "alerta",
            "alerta_tipo",
            "tipo_notificacion",
            "estado_envio",
            "fecha_envio",
            "fecha_confirmacion",
            "detalle_respuesta",
        ]