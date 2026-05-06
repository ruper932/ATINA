from rest_framework import viewsets
from .models import TipoDispositivo, Dispositivo, TipoSensor, Sensor, TipoActuador, Actuador
from .serializers import (
    TipoDispositivoSerializer,
    DispositivoSerializer,
    TipoSensorSerializer,
    SensorSerializer,
    TipoActuadorSerializer,
    ActuadorSerializer,
)


class TipoDispositivoViewSet(viewsets.ModelViewSet):
    queryset = TipoDispositivo.objects.all()
    serializer_class = TipoDispositivoSerializer


class DispositivoViewSet(viewsets.ModelViewSet):
    queryset = Dispositivo.objects.select_related(
        "tipo_dispositivo", "ubicacion", "fuente_agua"
    ).all()
    serializer_class = DispositivoSerializer


class TipoSensorViewSet(viewsets.ModelViewSet):
    queryset = TipoSensor.objects.all()
    serializer_class = TipoSensorSerializer


class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.select_related("dispositivo", "tipo_sensor").all()
    serializer_class = SensorSerializer


class TipoActuadorViewSet(viewsets.ModelViewSet):
    queryset = TipoActuador.objects.all()
    serializer_class = TipoActuadorSerializer


class ActuadorViewSet(viewsets.ModelViewSet):
    queryset = Actuador.objects.select_related(
        "dispositivo", "tipo_actuador", "invernadero"
    ).all()
    serializer_class = ActuadorSerializer