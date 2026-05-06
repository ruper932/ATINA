from rest_framework.routers import DefaultRouter
from .views import SincronizacionMCPViewSet

router = DefaultRouter()
router.register(
    r"sincronizaciones-mcp",
    SincronizacionMCPViewSet,
    basename="sincronizaciones-mcp"
)

urlpatterns = router.urls