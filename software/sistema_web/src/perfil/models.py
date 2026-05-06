from django.conf import settings
from django.db import models


class PerfilUsuario(models.Model):
    class GeneroChoices(models.TextChoices):
        MASCULINO = "masculino", "Masculino"
        FEMENINO = "femenino", "Femenino"
        OTRO = "otro", "Otro"
        PREFIERO_NO_DECIR = "no_decir", "Prefiero no decir"

    class RelacionSistemaChoices(models.TextChoices):
        ADMIN = "admin", "Administrador"
        DOCENTE = "docente", "Docente"
        TECNICO = "tecnico", "Técnico"
        ESTUDIANTE = "estudiante", "Estudiante"
        OTRO = "otro", "Otro"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="perfil"
    )
    ci_documento = models.CharField(max_length=30, unique=True)
    telefono = models.CharField(max_length=20, blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    genero = models.CharField(
        max_length=20,
        choices=GeneroChoices.choices,
        blank=True
    )
    fotografia = models.ImageField(
        upload_to="perfiles/",
        null=True,
        blank=True
    )
    cargo_descripcion = models.CharField(max_length=150, blank=True)
    relacion_sistema = models.CharField(
        max_length=20,
        choices=RelacionSistemaChoices.choices,
        default=RelacionSistemaChoices.OTRO
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Perfil de {self.user.username}"