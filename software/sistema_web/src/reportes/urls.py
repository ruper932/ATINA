from rest_framework.routers import DefaultRouter
from .views import ReporteSemanalViewSet

router = DefaultRouter()
router.register(r"reportes-semanales", ReporteSemanalViewSet, basename="reportes-semanales")

urlpatterns = router.urls