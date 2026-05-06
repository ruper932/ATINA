from rest_framework import viewsets
from .models import Invernadero, Atrapaniebla, FuenteAgua
from .serializers import (
    InvernaderoSerializer,
    AtrapanieblaSerializer,
    FuenteAguaSerializer,
)


class InvernaderoViewSet(viewsets.ModelViewSet):
    queryset = Invernadero.objects.select_related("ubicacion").all()
    serializer_class = InvernaderoSerializer


class AtrapanieblaViewSet(viewsets.ModelViewSet):
    queryset = Atrapaniebla.objects.select_related("ubicacion").all()
    serializer_class = AtrapanieblaSerializer


class FuenteAguaViewSet(viewsets.ModelViewSet):
    queryset = FuenteAgua.objects.select_related("ubicacion").all()
    serializer_class = FuenteAguaSerializer