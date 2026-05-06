from rest_framework import viewsets
from .models import AuditoriaAccion
from .serializers import AuditoriaAccionSerializer


class AuditoriaAccionViewSet(viewsets.ModelViewSet):
    queryset = AuditoriaAccion.objects.select_related("usuario").all()
    serializer_class = AuditoriaAccionSerializer