from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from django.shortcuts import redirect
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    path(
        "accounts/login/",
        auth_views.LoginView.as_view(
            template_name="auth/login.html",
            redirect_authenticated_user=True,
        ),
        name="login",
    ),
    path(
        "accounts/logout/",
        auth_views.LogoutView.as_view(),
        name="logout",
    ),

    path("", include("dashboard.urls")),
    path("", include("perfil.urls")),


    path("api/", include("perfil.urls")),

    path("api/", include("ubicaciones.urls")),
    path("api/", include("infraestructura.urls")),
    path("api/", include("dispositivos.urls")),
    path("api/", include("monitoreo.urls")),
    path("api/", include("riego.urls")),
    path("api/", include("alertas.urls")),
    path("api/", include("configuracion.urls")),
    path("api/", include("integraciones.urls")),
    path("api/", include("auditoria.urls")),
    path("api/", include("reportes.urls")),
    path("api/", include("ml.urls")),
    path("api/", include("mantenimiento.urls")),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)