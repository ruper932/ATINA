from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .decorators import group_required

@login_required
def home(request):
    return render(request, "dashboard/home.html")

@group_required("Administrador")
def panel_admin(request):
    return render(request, "dashboard/admin.html")