from rest_framework.routers import DefaultRouter
from .views import AlertaViewSet, NotificacionLocalViewSet

router = DefaultRouter()
router.register(r"alertas", AlertaViewSet, basename="alertas")
router.register(r"notificaciones-locales", NotificacionLocalViewSet, basename="notificaciones-locales")

urlpatterns = router.urls