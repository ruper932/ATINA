from rest_framework.routers import DefaultRouter
from .views import LecturaSensorViewSet

router = DefaultRouter()
router.register(r"lecturas-sensor", LecturaSensorViewSet, basename="lecturas-sensor")

urlpatterns = router.urls