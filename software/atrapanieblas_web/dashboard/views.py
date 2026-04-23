from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from .models import (
    VwReporteInvernaderosUbicacion,
    VwReporteSensoresTipo,
    VwReporteFuentesUbicacion,
    VwReporteLecturasSensorTipo,
    VwReporteDecisionesInvernaderoFuente,
)

from .models import PerfilUsuario, Rol

import base64
import cv2
import face_recognition
import numpy as np


def _get_default_role():
    return Rol.objects.filter(nombre="estudiante").first() or Rol.objects.filter(nombre="docente").first()


@login_required
def register_face(request):
    if request.method == "POST":
        image_data = request.POST.get("image_data")
        if image_data:
            image_bytes = base64.b64decode(image_data.split(",")[1])
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            encodings = face_recognition.face_encodings(rgb_image)

            if not encodings:
                return JsonResponse(
                    {"success": False, "message": "No se detectó ningún rostro"}
                )

            profile = PerfilUsuario.objects.filter(user=request.user).first()

            if profile is None:
                default_role = _get_default_role()
                if default_role is None:
                    return JsonResponse(
                        {
                            "success": False,
                            "message": "No existe un rol por defecto configurado.",
                        }
                    )

                profile = PerfilUsuario.objects.create(
                    user=request.user,
                    rol=default_role,
                    estado="activo",
                )

            profile.set_face_encoding(encodings[0])
            profile.save()

            return JsonResponse(
                {"success": True, "message": "Rostro registrado correctamente"}
            )

    return render(request, "register_face.html")


def face_login(request):
    if request.method == "POST":
        image_data = request.POST.get("image_data")
        if image_data:
            image_bytes = base64.b64decode(image_data.split(",")[1])
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            encodings = face_recognition.face_encodings(rgb_image)

            if not encodings:
                return JsonResponse(
                    {"success": False, "message": "No se detectó ningún rostro"}
                )

            unknown_encoding = encodings[0]

            perfiles = PerfilUsuario.objects.select_related("user", "rol").exclude(
                face_encoding__isnull=True
            ).exclude(face_encoding="").filter(estado="activo")

            for profile in perfiles:
                known_encoding = profile.get_face_encoding()
                if known_encoding is None:
                    continue

                matches = face_recognition.compare_faces(
                    [known_encoding],
                    unknown_encoding,
                    tolerance=0.5,
                )

                if matches[0]:
                    login(request, profile.user)
                    return JsonResponse(
                        {
                            "success": True,
                            "message": f"Bienvenido {profile.user.username}",
                        }
                    )

            return JsonResponse(
                {"success": False, "message": "Rostro no reconocido"}
            )

    return render(request, "face_login.html")


def user_login(request):
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get("username")
            password = form.cleaned_data.get("password")
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect("home")
    else:
        form = AuthenticationForm()

    return render(request, "registration/login.html", {"form": form})


@login_required
def user_logout(request):
    logout(request)
    return redirect("/accounts/login/")


@staff_member_required(login_url="/biometric/login/")
def user_list(request):
    users = User.objects.all().order_by("-date_joined")
    return render(request, "dashboard/user_list.html", {"users": users})


@staff_member_required(login_url="/biometric/login/")
def user_create(request):
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "").strip()
        is_staff = request.POST.get("is_staff") == "on"

        if not username or not password:
            messages.error(request, "Usuario y contraseña son obligatorios.")
            return redirect("user_create")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Ese nombre de usuario ya existe.")
            return redirect("user_create")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=is_staff,
        )

        default_role = _get_default_role()
        if default_role:
            PerfilUsuario.objects.get_or_create(
                user=user,
                defaults={
                    "rol": default_role,
                    "estado": "activo",
                },
            )

        messages.success(request, "Usuario creado correctamente.")
        return redirect("user_list")

    return render(request, "dashboard/user_create.html")


@staff_member_required(login_url="/biometric/login/")
def user_delete(request, user_id):
    user_obj = get_object_or_404(User, id=user_id)

    if request.method == "POST":
        if request.user.id == user_obj.id:
            messages.error(request, "No puedes eliminar tu propio usuario.")
        else:
            user_obj.delete()
            messages.success(request, "Usuario eliminado correctamente.")
        return redirect("user_list")

    return render(request, "dashboard/user_delete.html", {"user_obj": user_obj})

#--------------- Reportes --------------------------------------

@staff_member_required(login_url="/accounts/login/")
def reportes_view(request):
    invernaderos = VwReporteInvernaderosUbicacion.objects.all().order_by("codigo")
    sensores = VwReporteSensoresTipo.objects.all().order_by("codigo")
    fuentes = VwReporteFuentesUbicacion.objects.all().order_by("codigo")
    lecturas = VwReporteLecturasSensorTipo.objects.all().order_by("-timestamp_lectura")[:10]
    decisiones = VwReporteDecisionesInvernaderoFuente.objects.all().order_by("-ejecutado_en")[:10]

    context = {
        "total_invernaderos": invernaderos.count(),
        "total_sensores": sensores.count(),
        "total_fuentes": fuentes.count(),
        "total_lecturas": VwReporteLecturasSensorTipo.objects.count(),
        "total_decisiones": VwReporteDecisionesInvernaderoFuente.objects.count(),
        "invernaderos": invernaderos[:10],
        "sensores": sensores[:10],
        "fuentes": fuentes[:10],
        "lecturas": lecturas,
        "decisiones": decisiones,
    }
    return render(request, "dashboard/reportes.html", context)
#--------------- EndReportes --------------------------------------