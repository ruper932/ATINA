from rest_framework import serializers
from .models import Invernadero, Atrapaniebla, FuenteAgua


class InvernaderoSerializer(serializers.ModelSerializer):
    ubicacion_nombre = serializers.CharField(source="ubicacion.nombre", read_only=True)

    class Meta:
        model = Invernadero
        fields = [
            "id",
            "ubicacion",
            "ubicacion_nombre",
            "codigo",
            "nombre",
            "descripcion",
            "area_m2",
            "prioridad_riego",
            "estado",
            "creado_en",
        ]


class AtrapanieblaSerializer(serializers.ModelSerializer):
    ubicacion_nombre = serializers.CharField(source="ubicacion.nombre", read_only=True)

    class Meta:
        model = Atrapaniebla
        fields = [
            "id",
            "ubicacion",
            "ubicacion_nombre",
            "codigo",
            "nombre",
            "area_malla_m2",
            "tipo_malla",
            "orientacion",
            "estado",
            "fecha_instalacion",
            "creado_en",
        ]


class FuenteAguaSerializer(serializers.ModelSerializer):
    ubicacion_nombre = serializers.CharField(source="ubicacion.nombre", read_only=True)

    class Meta:
        model = FuenteAgua
        fields = [
            "id",
            "ubicacion",
            "ubicacion_nombre",
            "codigo",
            "nombre",
            "tipo_fuente",
            "descripcion",
            "capacidad_l",
            "estado",
            "creado_en",
        ]