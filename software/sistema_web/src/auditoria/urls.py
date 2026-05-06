from rest_framework.routers import DefaultRouter
from .views import AuditoriaAccionViewSet

router = DefaultRouter()
router.register(r"auditoria-acciones", AuditoriaAccionViewSet, basename="auditoria-acciones")

urlpatterns = router.urls