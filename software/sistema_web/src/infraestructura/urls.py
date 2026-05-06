from rest_framework.routers import DefaultRouter
from .views import InvernaderoViewSet, AtrapanieblaViewSet, FuenteAguaViewSet

router = DefaultRouter()
router.register(r"invernaderos", InvernaderoViewSet, basename="invernaderos")
router.register(r"atrapanieblas", AtrapanieblaViewSet, basename="atrapanieblas")
router.register(r"fuentes-agua", FuenteAguaViewSet, basename="fuentes-agua")

urlpatterns = router.urls