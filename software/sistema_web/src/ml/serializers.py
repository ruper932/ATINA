from rest_framework import serializers
from .models import PrediccionML1, SimulacionML3


class PrediccionML1Serializer(serializers.ModelSerializer):
    fuente_agua_nombre = serializers.CharField(source="fuente_agua.nombre", read_only=True)

    class Meta:
        model = PrediccionML1
        fields = [
            "id",
            "fuente_agua",
            "fuente_agua_nombre",
            "fecha_prediccion",
            "fecha_objetivo",
            "volumen_predicho_l",
            "margen_error",
            "confianza_modelo",
            "variables_entrada_resumen",
            "version_modelo",
            "generado_en",
        ]


class SimulacionML3Serializer(serializers.ModelSerializer):
    invernadero_nombre = serializers.CharField(source="invernadero.nombre", read_only=True)

    class Meta:
        model = SimulacionML3
        fields = [
            "id",
            "invernadero",
            "invernadero_nombre",
            "fecha_generacion",
            "horizonte_horas",
            "escenario",
            "nivel_riesgo",
            "descripcion_resultado",
            "recomendacion",
            "version_modelo",
            "generado_en",
        ]