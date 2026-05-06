from rest_framework import viewsets
from .models import Ubicacion
from .serializers import UbicacionSerializer


class UbicacionViewSet(viewsets.ModelViewSet):
    queryset = Ubicacion.objects.select_related("parent").all()
    serializer_class = UbicacionSerializer