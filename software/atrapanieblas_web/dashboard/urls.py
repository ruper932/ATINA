from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.user_login, name='user_login'),
    path('logout/', views.user_logout, name='user_logout'),
    path('register-face/', views.register_face, name='register_face'),
    path('face-login/', views.face_login, name='face_login'),
    path('admin-panel/users/', views.user_list, name='user_list'),
    path('admin-panel/users/create/', views.user_create, name='user_create'),
    path('admin-panel/users/delete/<int:user_id>/', views.user_delete, name='user_delete'),
]