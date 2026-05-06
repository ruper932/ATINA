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
    Invernadero,
    Dispositivo,
    Sensor,
    FuenteAgua,
    Alerta,
    LecturaSensor,
    DecisionRiego,
    Atrapaniebla,
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
#--------------- End Reportes --------------------------------------


#--------------- Dashboard --------------------------------------

@login_required
def dashboard_view(request):
    from django.db.models import Count, Avg, Max, Min
    from django.utils import timezone
    from datetime import timedelta

    now = timezone.now()
    today = now.date()
    week_ago = now - timedelta(days=7)

    ultimas_alertas = Alerta.objects.select_related('invernadero', 'dispositivo', 'sensor').order_by('-fecha_generacion')[:5]
    alertas_activas = Alerta.objects.filter(estado_alerta='activa').count()
    
    ultimas_lecturas = LecturaSensor.objects.select_related('sensor__tipo_sensor', 'sensor__dispositivo').order_by('-timestamp_lectura')[:10]
    
    ultimas_decisiones = DecisionRiego.objects.select_related('invernadero', 'fuente_agua').order_by('-ejecutado_en')[:5]

    invernaderos = Invernadero.objects.all()
    total_invernaderos = invernaderos.count()
    invernaderos_activos = invernaderos.filter(estado='activo').count()

    dispositivos = Dispositivo.objects.all()
    total_dispositivos = dispositivos.count()
    dispositivos_activos = dispositivos.filter(estado='activo').count()

    sensores = Sensor.objects.all()
    total_sensores = sensores.count()
    sensores_activos = sensores.filter(estado='activo').count()

    fuentes = FuenteAgua.objects.all()
    total_fuentes = fuentes.count()
    fuentes_activas = fuentes.filter(estado='activo').count()

    atrapanieblas = Atrapaniebla.objects.all()
    total_atrapanieblas = atrapanieblas.count()
    atrapanieblas_activas = atrapanieblas.filter(estado='activo').count()

    context = {
        'ultimas_alertas': ultimas_alertas,
        'alertas_activas': alertas_activas,
        'ultimas_lecturas': ultimas_lecturas,
        'ultimas_decisiones': ultimas_decisiones,
        'total_invernaderos': total_invernaderos,
        'invernaderos_activos': invernaderos_activos,
        'total_dispositivos': total_dispositivos,
        'dispositivos_activos': dispositivos_activos,
        'total_sensores': total_sensores,
        'sensores_activos': sensores_activos,
        'total_fuentes': total_fuentes,
        'fuentes_activas': fuentes_activas,
        'total_atrapanieblas': total_atrapanieblas,
        'atrapanieblas_activas': atrapanieblas_activas,
    }
    return render(request, "dashboard/dashboard.html", context)


def dashboard_api(request):
    from django.db.models import Count
    from django.utils import timezone
    from datetime import timedelta

    now = timezone.now()

    alertas_por_estado = list(
        Alerta.objects.values('estado_alerta')
        .annotate(count=Count('id'))
        .order_by('estado_alerta')
    )

    alertas_por_severidad = list(
        Alerta.objects.values('severidad')
        .annotate(count=Count('id'))
        .order_by('severidad')
    )

    ultimas_lecturas = list(
        LecturaSensor.objects.select_related('sensor__tipo_sensor')
        .order_by('-timestamp_lectura')[:20]
        .values(
            'id', 'valor', 'timestamp_lectura', 'calidad_dato',
            sensor__tipo_sensor__variable_medida, 
            sensor__tipo_sensor__unidad_base
        )
    )

    decisiones_por_origen = list(
        DecisionRiego.objects.values('origen_decision')
        .annotate(count=Count('id'))
        .order_by('origen_decision')
    )

    return JsonResponse({
        'alertas_por_estado': alertas_por_estado,
        'alertas_por_severidad': alertas_por_severidad,
        'ultimas_lecturas': ultimas_lecturas,
        'decisiones_por_origen': decisiones_por_origen,
    })


#--------------- End Dashboard --------------------------------------