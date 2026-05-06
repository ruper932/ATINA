from rest_framework import viewsets
from .models import Alerta, NotificacionLocal
from .serializers import AlertaSerializer, NotificacionLocalSerializer


class AlertaViewSet(viewsets.ModelViewSet):
    queryset = Alerta.objects.select_related(
        "invernadero", "dispositivo", "sensor", "decision_riego",
        "simulacion_ml3", "usuario_reconoce"
    ).all()
    serializer_class = AlertaSerializer


class NotificacionLocalViewSet(viewsets.ModelViewSet):
    queryset = NotificacionLocal.objects.select_related("alerta").all()
    serializer_class = NotificacionLocalSerializer