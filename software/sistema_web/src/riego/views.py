from rest_framework import viewsets
from .models import DecisionRiego, EstadoRiegoActual
from .serializers import DecisionRiegoSerializer, EstadoRiegoActualSerializer


class DecisionRiegoViewSet(viewsets.ModelViewSet):
    queryset = DecisionRiego.objects.select_related(
        "invernadero", "actuador", "fuente_agua"
    ).all()
    serializer_class = DecisionRiegoSerializer


class EstadoRiegoActualViewSet(viewsets.ModelViewSet):
    queryset = EstadoRiegoActual.objects.select_related(
        "invernadero", "ultima_decision"
    ).all()
    serializer_class = EstadoRiegoActualSerializer