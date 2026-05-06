from rest_framework import serializers
from .models import ReporteSemanal


class ReporteSemanalSerializer(serializers.ModelSerializer):
    generado_por_username = serializers.CharField(source="generado_por.username", read_only=True)

    class Meta:
        model = ReporteSemanal
        fields = [
            "id",
            "periodo_inicio",
            "periodo_fin",
            "volumen_captado_l",
            "volumen_predicho_l",
            "eficiencia_riego",
            "total_alertas",
            "resumen",
            "generado_por",
            "generado_por_username",
            "fecha_generacion",
        ]