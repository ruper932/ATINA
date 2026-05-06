from django.contrib.auth.models import User
from rest_framework import serializers
from .models import PerfilUsuario


class UserBasicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "is_active",
            "is_staff",
        ]


class PerfilUsuarioSerializer(serializers.ModelSerializer):
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True, format='%Y-%m-%d')
    user = UserBasicoSerializer(read_only=True)
    genero_display = serializers.CharField(source="get_genero_display", read_only=True)
    relacion_sistema_display = serializers.CharField(source="get_relacion_sistema_display", read_only=True)

    class Meta:
        model = PerfilUsuario
        fields = [
            "id",
            "user",
            "ci_documento",
            "telefono",
            "direccion",
            "fecha_nacimiento",
            "genero",
            "genero_display",
            "fotografia",
            "cargo_descripcion",
            "relacion_sistema",
            "relacion_sistema_display",
            "creado_en",
            "actualizado_en",
        ]