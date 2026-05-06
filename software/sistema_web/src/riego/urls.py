from rest_framework.routers import DefaultRouter
from .views import DecisionRiegoViewSet, EstadoRiegoActualViewSet

router = DefaultRouter()
router.register(r"decisiones-riego", DecisionRiegoViewSet, basename="decisiones-riego")
router.register(r"estado-riego-actual", EstadoRiegoActualViewSet, basename="estado-riego-actual")

urlpatterns = router.urls