from rest_framework.routers import DefaultRouter
from .views import UbicacionViewSet

router = DefaultRouter()
router.register(r"ubicaciones", UbicacionViewSet, basename="ubicaciones")

urlpatterns = router.urls