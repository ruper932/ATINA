from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Carga datos ficticios para los reportes de sensores, lecturas y decisiones de riego."

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Comando seed_reportes_demo detectado correctamente."))