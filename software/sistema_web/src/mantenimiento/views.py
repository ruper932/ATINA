from rest_framework import viewsets
from .models import CalibracionSensor
from .serializers import CalibracionSensorSerializer


class CalibracionSensorViewSet(viewsets.ModelViewSet):
    queryset = CalibracionSensor.objects.select_related("sensor", "usuario").all()
    serializer_class = CalibracionSensorSerializer