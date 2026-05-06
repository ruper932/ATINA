from rest_framework import viewsets
from .models import ConfiguracionUmbral
from .serializers import ConfiguracionUmbralSerializer


class ConfiguracionUmbralViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracionUmbral.objects.select_related(
        "invernadero",
        "sensor",
        "actualizado_por"
    ).all()
    serializer_class = ConfiguracionUmbralSerializer