from rest_framework import serializers
from .models import DecisionRiego, EstadoRiegoActual


class DecisionRiegoSerializer(serializers.ModelSerializer):
    invernadero_nombre = serializers.CharField(source="invernadero.nombre", read_only=True)
    actuador_nombre = serializers.CharField(source="actuador.nombre", read_only=True)
    fuente_agua_nombre = serializers.CharField(source="fuente_agua.nombre", read_only=True)

    class Meta:
        model = DecisionRiego
        fields = [
            "id",
            "invernadero",
            "invernadero_nombre",
            "actuador",
            "actuador_nombre",
            "fuente_agua",
            "fuente_agua_nombre",
            "origen_decision",
            "modo_riego",
            "estado_valvula",
            "volumen_disponible_l",
            "demanda_estimada_l",
            "volumen_aplicado_l",
            "decision_texto",
            "ejecutado_en",
        ]


class EstadoRiegoActualSerializer(serializers.ModelSerializer):
    invernadero_nombre = serializers.CharField(source="invernadero.nombre", read_only=True)
    ultima_decision_texto = serializers.CharField(source="ultima_decision.decision_texto", read_only=True)

    class Meta:
        model = EstadoRiegoActual
        fields = [
            "invernadero",
            "invernadero_nombre",
            "ultima_decision",
            "ultima_decision_texto",
            "actualizado_en",
        ]