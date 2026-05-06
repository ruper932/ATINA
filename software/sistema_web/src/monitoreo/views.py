from rest_framework import viewsets
from .models import LecturaSensor
from .serializers import LecturaSensorSerializer


class LecturaSensorViewSet(viewsets.ModelViewSet):
    queryset = LecturaSensor.objects.select_related("sensor").all()
    serializer_class = LecturaSensorSerializer

