from datetime import datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from dashboard.models import (
    Ubicacion,
    Invernadero,
    FuenteAgua,
    TipoSensor,
    TipoDispositivo,
    Dispositivo,
    Sensor,
    TipoActuador,
    Actuador,
    LecturaSensor,
    DecisionRiego,
)


class Command(BaseCommand):
    help = "Carga datos ficticios para los reportes de sensores, lecturas y decisiones de riego."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Creando catálogos base...")

        tipos_sensor = [
            {
                "nombre": "Sensor de Humedad",
                "variable_medida": "Humedad del suelo",
                "unidad_base": "%",
                "descripcion": "Sensor ficticio para pruebas de humedad.",
            },
            {
                "nombre": "Sensor de Temperatura",
                "variable_medida": "Temperatura ambiente",
                "unidad_base": "°C",
                "descripcion": "Sensor ficticio para pruebas de temperatura.",
            },
            {
                "nombre": "Sensor de Caudal",
                "variable_medida": "Caudal de agua",
                "unidad_base": "L/min",
                "descripcion": "Sensor ficticio para pruebas de caudal.",
            },
        ]

        for item in tipos_sensor:
            obj, created = TipoSensor.objects.get_or_create(
                nombre=item["nombre"],
                defaults={
                    "variable_medida": item["variable_medida"],
                    "unidad_base": item["unidad_base"],
                    "descripcion": item["descripcion"],
                },
            )
            self.stdout.write(f"TipoSensor: {obj.nombre} -> {'creado' if created else 'ya existía'}")

        tipos_dispositivo = [
            {
                "nombre": "Nodo de Sensores",
                "descripcion": "Dispositivo ficticio para alojar sensores.",
            },
            {
                "nombre": "Controlador de Riego",
                "descripcion": "Dispositivo ficticio para actuadores y decisiones.",
            },
        ]

        for item in tipos_dispositivo:
            obj, created = TipoDispositivo.objects.get_or_create(
                nombre=item["nombre"],
                defaults={"descripcion": item["descripcion"]},
            )
            self.stdout.write(f"TipoDispositivo: {obj.nombre} -> {'creado' if created else 'ya existía'}")

        tipo_actuador, created = TipoActuador.objects.get_or_create(
            nombre="Válvula de Riego",
            defaults={"descripcion": "Actuador ficticio para apertura y cierre de válvula."},
        )
        self.stdout.write(f"TipoActuador: {tipo_actuador.nombre} -> {'creado' if created else 'ya existía'}")

        self.stdout.write("Creando estructura principal...")

        ubicacion_invernadero, created = Ubicacion.objects.update_or_create(
            id=1001,
            defaults={
                "nombre": "Invernadero Norte",
                "tipo_ubicacion": "invernadero",
                "descripcion": "Ubicación ficticia del invernadero principal.",
                "latitud": -16.500000,
                "longitud": -68.150000,
                "altitud_m": 3600.00,
            },
        )
        self.stdout.write(f"Ubicacion: {ubicacion_invernadero.nombre} -> {'creado/actualizado' if created else 'actualizado'}")

        ubicacion_fuente, created = Ubicacion.objects.update_or_create(
            id=1002,
            defaults={
                "nombre": "Fuente Principal",
                "tipo_ubicacion": "fuente_agua",
                "descripcion": "Ubicación ficticia de la fuente de agua.",
                "latitud": -16.501000,
                "longitud": -68.151000,
                "altitud_m": 3601.00,
            },
        )
        self.stdout.write(f"Ubicacion: {ubicacion_fuente.nombre} -> {'creado/actualizado' if created else 'actualizado'}")

        invernadero, created = Invernadero.objects.update_or_create(
            codigo="INV-001",
            defaults={
                "ubicacion": ubicacion_invernadero,
                "nombre": "Invernadero Experimental 1",
                "descripcion": "Invernadero ficticio para pruebas de reportes.",
                "area_m2": 120.50,
                "prioridad_riego": 1,
                "estado": "activo",
            },
        )
        self.stdout.write(f"Invernadero: {invernadero.codigo} -> {'creado/actualizado' if created else 'actualizado'}")

        fuente_agua, created = FuenteAgua.objects.update_or_create(
            codigo="FA-001",
            defaults={
                "ubicacion": ubicacion_fuente,
                "nombre": "Tanque Principal",
                "tipo_fuente": "tanque",
                "descripcion": "Fuente de agua ficticia para reportes.",
                "capacidad_l": 5000.00,
                "estado": "activo",
            },
        )
        self.stdout.write(f"FuenteAgua: {fuente_agua.codigo} -> {'creado/actualizado' if created else 'actualizado'}")

        nodo_sensores = TipoDispositivo.objects.get(nombre="Nodo de Sensores")
        controlador_riego = TipoDispositivo.objects.get(nombre="Controlador de Riego")

        dispositivo_sensor, created = Dispositivo.objects.update_or_create(
            codigo="DISP-SENS-001",
            defaults={
                "tipo_dispositivo": nodo_sensores,
                "ubicacion": ubicacion_invernadero,
                "fuente_agua": fuente_agua,
                "nombre": "Nodo Sensorial Norte",
                "identificador_local": "NS-001",
                "ip_local": "192.168.1.10",
                "version_firmware": "1.0.0",
                "estado": "activo",
            },
        )
        self.stdout.write(f"Dispositivo: {dispositivo_sensor.codigo} -> {'creado/actualizado' if created else 'actualizado'}")

        dispositivo_riego, created = Dispositivo.objects.update_or_create(
            codigo="DISP-RIEGO-001",
            defaults={
                "tipo_dispositivo": controlador_riego,
                "ubicacion": ubicacion_invernadero,
                "fuente_agua": fuente_agua,
                "nombre": "Controlador de Riego Norte",
                "identificador_local": "CR-001",
                "ip_local": "192.168.1.20",
                "version_firmware": "1.0.0",
                "estado": "activo",
            },
        )
        self.stdout.write(f"Dispositivo: {dispositivo_riego.codigo} -> {'creado/actualizado' if created else 'actualizado'}")

        sensor_humedad_tipo = TipoSensor.objects.get(nombre="Sensor de Humedad")
        sensor_temperatura_tipo = TipoSensor.objects.get(nombre="Sensor de Temperatura")
        sensor_caudal_tipo = TipoSensor.objects.get(nombre="Sensor de Caudal")

        sensores = [
            {
                "codigo": "SEN-HUM-001",
                "nombre": "Sensor de Humedad Norte",
                "tipo_sensor": sensor_humedad_tipo,
                "modelo": "HUM-AX1",
                "numero_serie": "H001-AX1",
            },
            {
                "codigo": "SEN-TMP-001",
                "nombre": "Sensor de Temperatura Norte",
                "tipo_sensor": sensor_temperatura_tipo,
                "modelo": "TMP-BX2",
                "numero_serie": "T001-BX2",
            },
            {
                "codigo": "SEN-CAU-001",
                "nombre": "Sensor de Caudal Principal",
                "tipo_sensor": sensor_caudal_tipo,
                "modelo": "CAU-CX3",
                "numero_serie": "C001-CX3",
            },
        ]

        sensor_objs = []
        for item in sensores:
            sensor, created = Sensor.objects.update_or_create(
                codigo=item["codigo"],
                defaults={
                    "dispositivo": dispositivo_sensor,
                    "tipo_sensor": item["tipo_sensor"],
                    "nombre": item["nombre"],
                    "modelo": item["modelo"],
                    "numero_serie": item["numero_serie"],
                    "precision_valor": 0.1000,
                    "estado": "activo",
                },
            )
            sensor_objs.append(sensor)
            self.stdout.write(f"Sensor: {sensor.codigo} -> {'creado/actualizado' if created else 'actualizado'}")

        actuador, created = Actuador.objects.update_or_create(
            codigo="ACT-RIEGO-001",
            defaults={
                "dispositivo": dispositivo_riego,
                "tipo_actuador": tipo_actuador,
                "invernadero": invernadero,
                "nombre": "Válvula Principal Norte",
                "estado": "activo",
            },
        )
        self.stdout.write(f"Actuador: {actuador.codigo} -> {'creado/actualizado' if created else 'actualizado'}")

        self.stdout.write("Creando lecturas ficticias...")

        lecturas_data = [
            (sensor_objs[0], 41.2500, "valido", datetime(2026, 4, 23, 17, 11)),
            (sensor_objs[0], 39.8000, "valido", datetime(2026, 4, 23, 17, 12)),
            (sensor_objs[0], 38.4500, "estimado", datetime(2026, 4, 23, 17, 13)),
            (sensor_objs[1], 18.9000, "valido", datetime(2026, 4, 23, 17, 14)),
            (sensor_objs[1], 19.3000, "valido", datetime(2026, 4, 23, 17, 15)),
            (sensor_objs[1], 20.1000, "valido", datetime(2026, 4, 23, 17, 16)),
            (sensor_objs[2], 12.5000, "valido", datetime(2026, 4, 23, 17, 17)),
            (sensor_objs[2], 11.8000, "estimado", datetime(2026, 4, 23, 17, 18)),
            (sensor_objs[2], 13.2000, "valido", datetime(2026, 4, 23, 17, 19)),
        ]

        for sensor, valor, calidad, dt_naive in lecturas_data:
            dt = timezone.make_aware(dt_naive)
            lectura, created = LecturaSensor.objects.update_or_create(
                sensor=sensor,
                timestamp_lectura=dt,
                defaults={
                    "valor": valor,
                    "calidad_dato": calidad,
                },
            )
            self.stdout.write(
                f"Lectura: {sensor.codigo} {lectura.timestamp_lectura} -> {'creada/actualizada' if created else 'actualizada'}"
            )

        self.stdout.write("Creando decisiones de riego ficticias...")

        decisiones_data = [
            ("manual", "manual", "abierta", 120.0000, 95.0000, 88.5000, datetime(2026, 4, 23, 18, 6)),
            ("ml2", "automatico", "cerrada", 150.0000, 110.0000, 102.0000, datetime(2026, 4, 23, 18, 7)),
            ("tecnico", "manual", "parcial", 130.0000, 100.0000, 75.0000, datetime(2026, 4, 23, 18, 8)),
            ("reglaseguridad", "contingencia", "abierta", 160.0000, 140.0000, 140.0000, datetime(2026, 4, 23, 18, 9)),
        ]

        for origen, modo, estado, disponible, demanda, aplicado, dt_naive in decisiones_data:
            dt = timezone.make_aware(dt_naive)
            decision, created = DecisionRiego.objects.update_or_create(
                invernadero=invernadero,
                ejecutado_en=dt,
                defaults={
                    "actuador": actuador,
                    "fuente_agua": fuente_agua,
                    "origen_decision": origen,
                    "modo_riego": modo,
                    "estado_valvula": estado,
                    "volumen_disponible_l": disponible,
                    "demanda_estimada_l": demanda,
                    "volumen_aplicado_l": aplicado,
                    "decision_texto": "Registro ficticio para pruebas de reportes.",
                },
            )
            self.stdout.write(
                f"DecisionRiego: {decision.invernadero.codigo} {decision.ejecutado_en} -> {'creada/actualizada' if created else 'actualizada'}"
            )

        self.stdout.write(self.style.SUCCESS("Seed de reportes completada correctamente."))