from django.db import migrations
from django.utils import timezone


def seed_data(apps, schema_editor):
    Rol = apps.get_model("dashboard", "Rol")
    Ubicacion = apps.get_model("dashboard", "Ubicacion")
    Invernadero = apps.get_model("dashboard", "Invernadero")
    Atrapaniebla = apps.get_model("dashboard", "Atrapaniebla")
    FuenteAgua = apps.get_model("dashboard", "FuenteAgua")
    TipoDispositivo = apps.get_model("dashboard", "TipoDispositivo")
    TipoSensor = apps.get_model("dashboard", "TipoSensor")
    TipoActuador = apps.get_model("dashboard", "TipoActuador")

    # Roles
    roles = [
        ("admin", "Administrador del sistema"),
        ("docente", "Docente técnico del CEA"),
        ("tecnico", "Responsable de mantenimiento y calibración"),
        ("estudiante", "Usuario final pedagógico"),
    ]
    for nombre, descripcion in roles:
        Rol.objects.get_or_create(
            nombre=nombre,
            defaults={"descripcion": descripcion},
        )

    # Ubicaciones
    ubicaciones = [
        (1, "CEA Ildefonso de las Muñecas", "campus", "Predio principal en Titicachi", None, 3800.00),
        (2, "Sector invernaderos", "sector", "Área productiva académica", 1, 3800.00),
        (3, "Laboratorio local", "laboratorio", "Espacio de dashboard y servidor MCP", 1, 3800.00),
        (4, "Atrapaniebla Norte", "atrapaniebla", "Estructura de captación 1", 1, 3800.00),
        (5, "Atrapaniebla Sur", "atrapaniebla", "Estructura de captación 2", 1, 3800.00),
        (6, "Invernadero 1", "invernadero", "Invernadero académico 1", 2, 3800.00),
        (7, "Invernadero 2", "invernadero", "Invernadero académico 2", 2, 3800.00),
        (8, "Invernadero 3", "invernadero", "Invernadero académico 3", 2, 3800.00),
        (9, "Invernadero 4", "invernadero", "Invernadero académico 4", 2, 3800.00),
        (10, "Manantial comunitario", "fuente_agua", "Fuente hídrica principal actual", 1, 3800.00),
    ]

    ubicacion_objs = {}
    for id_, nombre, tipo, descripcion, parent_id, altitud in ubicaciones:
        parent = ubicacion_objs.get(parent_id) if parent_id else None
        obj, _ = Ubicacion.objects.update_or_create(
            id=id_,
            defaults={
                "nombre": nombre,
                "tipo_ubicacion": tipo,
                "descripcion": descripcion,
                "parent": parent,
                "altitud_m": altitud,
            },
        )
        ubicacion_objs[id_] = obj

    # Invernaderos
    invernaderos = [
        (6, "INV-01", "Invernadero 1", "Invernadero académico 1", 20.00, 1),
        (7, "INV-02", "Invernadero 2", "Invernadero académico 2", 20.00, 2),
        (8, "INV-03", "Invernadero 3", "Invernadero académico 3", 20.00, 3),
        (9, "INV-04", "Invernadero 4", "Invernadero académico 4", 20.00, 4),
    ]
    for ubicacion_id, codigo, nombre, descripcion, area_m2, prioridad_riego in invernaderos:
        Invernadero.objects.update_or_create(
            codigo=codigo,
            defaults={
                "ubicacion": ubicacion_objs[ubicacion_id],
                "nombre": nombre,
                "descripcion": descripcion,
                "area_m2": area_m2,
                "prioridad_riego": prioridad_riego,
                "estado": "activo",
            },
        )

    # Atrapanieblas
    hoy = timezone.now().date()
    atrapanieblas = [
        (4, "ATR-01", "Atrapaniebla Norte", 20.00, "Raschel", "Norte", hoy),
        (5, "ATR-02", "Atrapaniebla Sur", 20.00, "Raschel", "Sur", hoy),
    ]
    for ubicacion_id, codigo, nombre, area_malla_m2, tipo_malla, orientacion, fecha_instalacion in atrapanieblas:
        Atrapaniebla.objects.update_or_create(
            codigo=codigo,
            defaults={
                "ubicacion": ubicacion_objs[ubicacion_id],
                "nombre": nombre,
                "area_malla_m2": area_malla_m2,
                "tipo_malla": tipo_malla,
                "orientacion": orientacion,
                "fecha_instalacion": fecha_instalacion,
                "estado": "activo",
            },
        )

    # Fuentes de agua
    fuentes = [
        (10, "FTE-01", "Manantial comunitario", "manantial", "Fuente hídrica principal del CEA", None),
        (4, "FTE-02", "Captación Atrapaniebla Norte", "atrapaniebla", "Agua captada por la estructura norte", None),
        (5, "FTE-03", "Captación Atrapaniebla Sur", "atrapaniebla", "Agua captada por la estructura sur", None),
    ]
    for ubicacion_id, codigo, nombre, tipo_fuente, descripcion, capacidad_l in fuentes:
        FuenteAgua.objects.update_or_create(
            codigo=codigo,
            defaults={
                "ubicacion": ubicacion_objs[ubicacion_id],
                "nombre": nombre,
                "tipo_fuente": tipo_fuente,
                "descripcion": descripcion,
                "capacidad_l": capacidad_l,
                "estado": "activo",
            },
        )

    # Tipos de dispositivo
    tipos_dispositivo = [
        ("ESP32", "Microcontrolador para adquisición y control local"),
        ("Servidor MCP", "Servidor local de interoperabilidad"),
        ("Gateway", "Puente de comunicación local"),
    ]
    for nombre, descripcion in tipos_dispositivo:
        TipoDispositivo.objects.get_or_create(
            nombre=nombre,
            defaults={"descripcion": descripcion},
        )

    # Tipos de sensor
    tipos_sensor = [
        ("BME680 Temperatura", "temperatura", "C", "Sensor de temperatura ambiental"),
        ("BME680 Presion", "presion_atmosferica", "hPa", "Sensor de presión atmosférica"),
        ("BME680 Humedad", "humedad_relativa", "%", "Sensor de humedad relativa"),
        ("Caudalimetro", "caudal", "L/min", "Sensor de caudal de agua captada"),
    ]
    for nombre, variable_medida, unidad_base, descripcion in tipos_sensor:
        TipoSensor.objects.get_or_create(
            nombre=nombre,
            defaults={
                "variable_medida": variable_medida,
                "unidad_base": unidad_base,
                "descripcion": descripcion,
            },
        )

    # Tipos de actuador
    tipos_actuador = [
        ("Valvula solenoide", "Actuador de apertura y cierre de riego"),
    ]
    for nombre, descripcion in tipos_actuador:
        TipoActuador.objects.get_or_create(
            nombre=nombre,
            defaults={"descripcion": descripcion},
        )


def unseed_data(apps, schema_editor):
    Rol = apps.get_model("dashboard", "Rol")
    Ubicacion = apps.get_model("dashboard", "Ubicacion")
    Invernadero = apps.get_model("dashboard", "Invernadero")
    Atrapaniebla = apps.get_model("dashboard", "Atrapaniebla")
    FuenteAgua = apps.get_model("dashboard", "FuenteAgua")
    TipoDispositivo = apps.get_model("dashboard", "TipoDispositivo")
    TipoSensor = apps.get_model("dashboard", "TipoSensor")
    TipoActuador = apps.get_model("dashboard", "TipoActuador")

    TipoActuador.objects.filter(nombre__in=[
        "Valvula solenoide",
    ]).delete()

    TipoSensor.objects.filter(nombre__in=[
        "BME680 Temperatura",
        "BME680 Presion",
        "BME680 Humedad",
        "Caudalimetro",
    ]).delete()

    TipoDispositivo.objects.filter(nombre__in=[
        "ESP32",
        "Servidor MCP",
        "Gateway",
    ]).delete()

    FuenteAgua.objects.filter(codigo__in=[
        "FTE-01", "FTE-02", "FTE-03",
    ]).delete()

    Atrapaniebla.objects.filter(codigo__in=[
        "ATR-01", "ATR-02",
    ]).delete()

    Invernadero.objects.filter(codigo__in=[
        "INV-01", "INV-02", "INV-03", "INV-04",
    ]).delete()

    Ubicacion.objects.filter(id__in=[
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]).delete()

    Rol.objects.filter(nombre__in=[
        "admin", "docente", "tecnico", "estudiante",
    ]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("dashboard", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_data, unseed_data),
    ]