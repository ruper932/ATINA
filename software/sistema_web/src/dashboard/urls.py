from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="dashboard_home"),
    path("admin-panel/", views.panel_admin, name="panel_admin"),
]