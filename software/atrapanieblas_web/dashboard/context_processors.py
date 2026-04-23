from .models import PerfilUsuario

def sidebar_context(request):
    user_role = None
    perfil = None

    if request.user.is_authenticated:
        perfil = (
            PerfilUsuario.objects
            .select_related("rol")
            .filter(user=request.user)
            .first()
        )
        if perfil and perfil.rol:
            user_role = perfil.rol.nombre.lower()

    return {
        "sidebar_user_role": user_role,
        "sidebar_perfil": perfil,
    }