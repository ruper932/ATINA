from rest_framework import viewsets
from .models import SincronizacionMCP
from .serializers import SincronizacionMCPSerializer


class SincronizacionMCPViewSet(viewsets.ModelViewSet):
    queryset = SincronizacionMCP.objects.select_related("dispositivo").all()
    serializer_class = SincronizacionMCPSerializer