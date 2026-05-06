from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .forms import PerfilUsuarioForm, RegistroUsuarioForm
from .models import PerfilUsuario
from .serializers import PerfilUsuarioSerializer


class PerfilUsuarioViewSet(viewsets.ModelViewSet):
    queryset = PerfilUsuario.objects.select_related("user").all()
    serializer_class = PerfilUsuarioSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        perfil, created = PerfilUsuario.objects.get_or_create(
            user=request.user,
            defaults={
                "ci_documento": f"PENDIENTE-{request.user.id}",
                "relacion_sistema": PerfilUsuario.RelacionSistemaChoices.OTRO,
            },
        )
        serializer = self.get_serializer(perfil)
        return Response(serializer.data)


@login_required
def mi_perfil(request):
    perfil, created = PerfilUsuario.objects.get_or_create(
        user=request.user,
        defaults={
            "ci_documento": f"PENDIENTE-{request.user.id}",
            "relacion_sistema": PerfilUsuario.RelacionSistemaChoices.OTRO,
        },
    )

    if request.method == "POST":
        form = PerfilUsuarioForm(request.POST, request.FILES, instance=perfil)
        if form.is_valid():
            form.save()
            messages.success(request, "Perfil actualizado correctamente.")
            return redirect("mi_perfil")
    else:
        form = PerfilUsuarioForm(instance=perfil)

    return render(request, "perfil/mi_perfil.html", {
        "form": form,
        "perfil": perfil,
    })


def registro_usuario(request):
    if request.user.is_authenticated:
        return redirect("mi_perfil")

    if request.method == "POST":
        form = RegistroUsuarioForm(request.POST)
        if form.is_valid():
            user = form.save()
            messages.success(request, "Usuario registrado correctamente.")
            login(request, user)
            return redirect("mi_perfil")
    else:
        form = RegistroUsuarioForm()

    return render(request, "auth/registro.html", {"form": form})