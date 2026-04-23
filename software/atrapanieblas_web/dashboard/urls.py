from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.face_login, name='face_login'),
    path('register-face/', views.register_face, name='register_face'),
    path('users/', views.user_list, name='user_list'),
    path('users/create/', views.user_create, name='user_create'),
    path('users/delete/<int:user_id>/', views.user_delete, name='user_delete'),
    path('reportes/', views.reportes_view, name='reportes'),
]