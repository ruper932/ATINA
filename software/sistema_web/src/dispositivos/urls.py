from rest_framework.routers import DefaultRouter
from .views import (
    TipoDispositivoViewSet,
    DispositivoViewSet,
    TipoSensorViewSet,
    SensorViewSet,
    TipoActuadorViewSet,
    ActuadorViewSet,
)

router = DefaultRouter()
router.register(r"tipos-dispositivo", TipoDispositivoViewSet, basename="tipos-dispositivo")
router.register(r"dispositivos", DispositivoViewSet, basename="dispositivos")
router.register(r"tipos-sensor", TipoSensorViewSet, basename="tipos-sensor")
router.register(r"sensores", SensorViewSet, basename="sensores")
router.register(r"tipos-actuador", TipoActuadorViewSet, basename="tipos-actuador")
router.register(r"actuadores", ActuadorViewSet, basename="actuadores")

urlpatterns = router.urls