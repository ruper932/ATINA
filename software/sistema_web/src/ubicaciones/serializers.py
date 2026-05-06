from rest_framework import serializers
from .models import Ubicacion


class UbicacionSerializer(serializers.ModelSerializer):
    parent_nombre = serializers.CharField(source="parent.nombre", read_only=True)

    class Meta:
        model = Ubicacion
        fields = [
            "id",
            "nombre",
            "tipo_ubicacion",
            "descripcion",
            "parent",
            "parent_nombre",
            "latitud",
            "longitud",
            "altitud_m",
        ]