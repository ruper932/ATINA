from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import PerfilUsuario

User = get_user_model()

MAPA_GRUPOS = {
    "admin": "Administrador",
    "docente": "Docente",
    "tecnico": "Técnico",
    "estudiante": "Estudiante",
    "otro": "Otro",
}


def asignar_grupo_por_relacion(usuario):
    if not hasattr(usuario, "perfil"):
        return

    relacion = usuario.perfil.relacion_sistema
    nombre_grupo = MAPA_GRUPOS.get(relacion)

    if not nombre_grupo:
        return

    grupo, _ = Group.objects.get_or_create(name=nombre_grupo)

    usuario.groups.clear()
    usuario.groups.add(grupo)


@receiver(post_save, sender=User)
def crear_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        PerfilUsuario.objects.get_or_create(
            user=instance,
            defaults={
                "ci_documento": f"PENDIENTE-{instance.id}",
                "relacion_sistema": PerfilUsuario.RelacionSistemaChoices.OTRO,
            },
        )
        asignar_grupo_por_relacion(instance)


@receiver(post_save, sender=PerfilUsuario)
def sincronizar_grupo_con_perfil(sender, instance, **kwargs):
    asignar_grupo_por_relacion(instance.user)