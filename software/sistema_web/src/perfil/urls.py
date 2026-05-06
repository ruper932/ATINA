from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import PerfilUsuarioViewSet, mi_perfil, registro_usuario

router = DefaultRouter()
router.register(r"perfiles", PerfilUsuarioViewSet, basename="perfiles")

urlpatterns = [
    path("api/", include(router.urls)),
    path("perfil/me/", mi_perfil, name="mi_perfil"),
    path("registro/", registro_usuario, name="registro"),
]