from rest_framework.routers import DefaultRouter
from .views import CalibracionSensorViewSet

router = DefaultRouter()
router.register(r"calibraciones-sensor", CalibracionSensorViewSet, basename="calibraciones-sensor")

urlpatterns = router.urls