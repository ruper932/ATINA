from rest_framework import viewsets
from .models import ReporteSemanal
from .serializers import ReporteSemanalSerializer


class ReporteSemanalViewSet(viewsets.ModelViewSet):
    queryset = ReporteSemanal.objects.select_related("generado_por").all()
    serializer_class = ReporteSemanalSerializer