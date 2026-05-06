from rest_framework.routers import DefaultRouter
from .views import ConfiguracionUmbralViewSet

router = DefaultRouter()
router.register(
    r"configuraciones-umbral",
    ConfiguracionUmbralViewSet,
    basename="configuraciones-umbral"
)

urlpatterns = router.urls