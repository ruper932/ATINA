from rest_framework import viewsets
from .models import PrediccionML1, SimulacionML3
from .serializers import PrediccionML1Serializer, SimulacionML3Serializer


class PrediccionML1ViewSet(viewsets.ModelViewSet):
    queryset = PrediccionML1.objects.select_related("fuente_agua").all()
    serializer_class = PrediccionML1Serializer


class SimulacionML3ViewSet(viewsets.ModelViewSet):
    queryset = SimulacionML3.objects.select_related("invernadero").all()
    serializer_class = SimulacionML3Serializer