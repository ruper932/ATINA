from rest_framework.routers import DefaultRouter
from .views import PrediccionML1ViewSet, SimulacionML3ViewSet

router = DefaultRouter()
router.register(r"predicciones-ml1", PrediccionML1ViewSet, basename="predicciones-ml1")
router.register(r"simulaciones-ml3", SimulacionML3ViewSet, basename="simulaciones-ml3")

urlpatterns = router.urls