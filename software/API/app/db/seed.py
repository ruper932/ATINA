# app/db/seed.py
import asyncio

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import AsyncSessionLocal

# Importar catálogos desde sus módulos respectivos
from app.models.catalogos import (
    CalidadDato,
    EscenarioSimulacion,
    EstadoActuador,
    EstadoAtrapaniebla,
    EstadoDispositivo,
    EstadoFuenteAgua,
    EstadoInvernadero,
    EstadoSensor,
    EstadoUsuario,
    EstadoValvula,
    ModoRiego,
    NivelRiesgo,
    OrigenDecision,
    Rol,
    TipoActuador,
    TipoDispositivo,
    TipoFuenteAgua,
    TipoSensor,
    TipoUbicacion,
)
from app.models.alertas import (
    EstadoAlerta,
    EstadoEnvio,
    OrigenAlerta,
    SeveridadAlerta,
    TipoNotificacion,
)
from app.models.umbrales import AmbitoUmbral
from app.models.reportes import EstadoSincronizacion


async def seed_table(
    session: AsyncSession,
    model,
    rows: list[dict],
    unique_fields: list[str] | None = None,
) -> None:
    """Inserta registros en un modelo ignorando duplicados."""
    stmt = insert(model).values(rows)
    if unique_fields:
        stmt = stmt.on_conflict_do_nothing(index_elements=unique_fields)
    await session.execute(stmt)


async def run_seed() -> None:
    async with AsyncSessionLocal() as session:
        # === app.models.catalogos ===
        await seed_table(session, Rol, [
            {"nombre": "invitado", "descripcion": "Usuario invitado"},
        ], ["nombre"])

        await seed_table(session, EstadoUsuario, [
            {"nombre": "activo", "descripcion": "Usuario habilitado"},
            {"nombre": "inactivo", "descripcion": "Usuario deshabilitado"},
            {"nombre": "bloqueado", "descripcion": "Usuario bloqueado por seguridad"},
        ], ["nombre"])

        await seed_table(session, TipoUbicacion, [
            {"nombre": "campus", "descripcion": "Predio principal"},
            {"nombre": "sector", "descripcion": "Sector interno del campus"},
            {"nombre": "invernadero", "descripcion": "Espacio de producción agrícola"},
            {"nombre": "atrapaniebla", "descripcion": "Estructura de captación de niebla"},
            {"nombre": "laboratorio", "descripcion": "Ambiente técnico o servidor local"},
            {"nombre": "fuente_agua", "descripcion": "Punto físico de abastecimiento hídrico"},
        ], ["nombre"])

        await seed_table(session, EstadoInvernadero, [
            {"nombre": "activo", "descripcion": "Invernadero operativo"},
            {"nombre": "inactivo", "descripcion": "Invernadero fuera de servicio"},
            {"nombre": "mantenimiento", "descripcion": "Invernadero en mantenimiento"},
        ], ["nombre"])

        await seed_table(session, EstadoAtrapaniebla, [
            {"nombre": "activo", "descripcion": "Atrapaniebla operativo"},
            {"nombre": "inactivo", "descripcion": "Atrapaniebla fuera de servicio"},
            {"nombre": "mantenimiento", "descripcion": "Atrapaniebla en mantenimiento"},
        ], ["nombre"])

        await seed_table(session, TipoFuenteAgua, [
            {"nombre": "manantial", "descripcion": "Fuente natural de agua"},
            {"nombre": "atrapaniebla", "descripcion": "Agua proveniente de captación de niebla"},
            {"nombre": "tanque", "descripcion": "Almacenamiento en tanque"},
            {"nombre": "otro", "descripcion": "Otro tipo de fuente"},
        ], ["nombre"])

        await seed_table(session, EstadoFuenteAgua, [
            {"nombre": "activo", "descripcion": "Fuente disponible"},
            {"nombre": "inactivo", "descripcion": "Fuente no disponible"},
            {"nombre": "mantenimiento", "descripcion": "Fuente en mantenimiento"},
        ], ["nombre"])

        await seed_table(session, TipoDispositivo, [
            {"nombre": "ESP32", "descripcion": "Microcontrolador para adquisición y control local"},
            {"nombre": "Servidor MCP", "descripcion": "Servidor local de interoperabilidad"},
            {"nombre": "Gateway", "descripcion": "Puente de comunicación local"},
        ], ["nombre"])

        await seed_table(session, EstadoDispositivo, [
            {"nombre": "activo", "descripcion": "Dispositivo operativo"},
            {"nombre": "inactivo", "descripcion": "Dispositivo deshabilitado"},
            {"nombre": "falla", "descripcion": "Dispositivo con falla"},
            {"nombre": "mantenimiento", "descripcion": "Dispositivo en mantenimiento"},
        ], ["nombre"])

        await seed_table(session, TipoSensor, [
            {"nombre": "BME680 Temperatura", "variable_medida": "temperatura", "unidad_base": "C", "descripcion": "Sensor de temperatura ambiental"},
            {"nombre": "BME680 Presion", "variable_medida": "presion_atmosferica", "unidad_base": "hPa", "descripcion": "Sensor de presión atmosférica"},
            {"nombre": "BME680 Humedad", "variable_medida": "humedad_relativa", "unidad_base": "%", "descripcion": "Sensor de humedad relativa"},
            {"nombre": "Caudalimetro", "variable_medida": "caudal", "unidad_base": "L/min", "descripcion": "Sensor de caudal de agua"},
        ], ["nombre"])

        await seed_table(session, EstadoSensor, [
            {"nombre": "activo", "descripcion": "Sensor operativo"},
            {"nombre": "inactivo", "descripcion": "Sensor deshabilitado"},
            {"nombre": "falla", "descripcion": "Sensor con falla"},
            {"nombre": "mantenimiento", "descripcion": "Sensor en mantenimiento"},
        ], ["nombre"])

        await seed_table(session, CalidadDato, [
            {"nombre": "valido", "descripcion": "Dato válido"},
            {"nombre": "estimado", "descripcion": "Dato estimado"},
            {"nombre": "atipico", "descripcion": "Dato atípico"},
            {"nombre": "invalido", "descripcion": "Dato inválido"},
        ], ["nombre"])

        await seed_table(session, TipoActuador, [
            {"nombre": "Valvula solenoide", "descripcion": "Actuador de apertura y cierre de riego"},
        ], ["nombre"])

        await seed_table(session, EstadoActuador, [
            {"nombre": "activo", "descripcion": "Actuador operativo"},
            {"nombre": "inactivo", "descripcion": "Actuador deshabilitado"},
            {"nombre": "falla", "descripcion": "Actuador con falla"},
            {"nombre": "mantenimiento", "descripcion": "Actuador en mantenimiento"},
        ], ["nombre"])

        await seed_table(session, OrigenDecision, [
            {"nombre": "ml2", "descripcion": "Decisión tomada por modelo ML2"},
            {"nombre": "manual", "descripcion": "Decisión manual"},
            {"nombre": "regla_seguridad", "descripcion": "Decisión tomada por regla de seguridad"},
            {"nombre": "tecnico", "descripcion": "Decisión tomada por técnico"},
            {"nombre": "docente", "descripcion": "Decisión tomada por docente"},
        ], ["nombre"])

        await seed_table(session, ModoRiego, [
            {"nombre": "automatico", "descripcion": "Riego automático"},
            {"nombre": "manual", "descripcion": "Riego manual"},
            {"nombre": "contingencia", "descripcion": "Riego por contingencia"},
        ], ["nombre"])

        await seed_table(session, EstadoValvula, [
            {"nombre": "abierta", "descripcion": "Válvula abierta"},
            {"nombre": "cerrada", "descripcion": "Válvula cerrada"},
            {"nombre": "parcial", "descripcion": "Válvula parcialmente abierta"},
            {"nombre": "falla", "descripcion": "Válvula con falla"},
        ], ["nombre"])

        await seed_table(session, EscenarioSimulacion, [
            {"nombre": "riego_normal", "descripcion": "Escenario con riego normal"},
            {"nombre": "riego_restringido", "descripcion": "Escenario con riego restringido"},
            {"nombre": "sin_riego", "descripcion": "Escenario sin riego"},
        ], ["nombre"])

        await seed_table(session, NivelRiesgo, [
            {"nombre": "bajo", "descripcion": "Riesgo bajo"},
            {"nombre": "medio", "descripcion": "Riesgo medio"},
            {"nombre": "alto", "descripcion": "Riesgo alto"},
            {"nombre": "critico", "descripcion": "Riesgo crítico"},
        ], ["nombre"])

        # === app.models.alertas ===
        await seed_table(session, SeveridadAlerta, [
            {"nombre": "info", "descripcion": "Información general"},
            {"nombre": "advertencia", "descripcion": "Advertencia operativa"},
            {"nombre": "alta", "descripcion": "Alerta alta"},
            {"nombre": "critica", "descripcion": "Alerta crítica"},
        ], ["nombre"])

        await seed_table(session, OrigenAlerta, [
            {"nombre": "ml1", "descripcion": "Alerta generada por ML1"},
            {"nombre": "ml2", "descripcion": "Alerta generada por ML2"},
            {"nombre": "ml3", "descripcion": "Alerta generada por ML3"},
            {"nombre": "sensor", "descripcion": "Alerta generada por sensores"},
            {"nombre": "mcp", "descripcion": "Alerta generada por sincronización MCP"},
            {"nombre": "dashboard", "descripcion": "Alerta generada desde dashboard"},
        ], ["nombre"])

        await seed_table(session, EstadoAlerta, [
            {"nombre": "activa", "descripcion": "Alerta activa"},
            {"nombre": "reconocida", "descripcion": "Alerta reconocida"},
            {"nombre": "resuelta", "descripcion": "Alerta resuelta"},
        ], ["nombre"])

        await seed_table(session, TipoNotificacion, [
            {"nombre": "led", "descripcion": "Notificación visual LED"},
            {"nombre": "buzzer", "descripcion": "Notificación sonora por buzzer"},
            {"nombre": "pantalla", "descripcion": "Notificación en pantalla local"},
            {"nombre": "audio", "descripcion": "Notificación por audio"},
        ], ["nombre"])

        await seed_table(session, EstadoEnvio, [
            {"nombre": "pendiente", "descripcion": "Envío pendiente"},
            {"nombre": "enviado", "descripcion": "Notificación enviada"},
            {"nombre": "confirmado", "descripcion": "Recepción confirmada"},
            {"nombre": "fallido", "descripcion": "Envío fallido"},
        ], ["nombre"])

        # === app.models.umbrales ===
        await seed_table(session, AmbitoUmbral, [
            {"nombre": "global", "descripcion": "Aplicación global"},
            {"nombre": "invernadero", "descripcion": "Aplicación por invernadero"},
            {"nombre": "sensor", "descripcion": "Aplicación por sensor"},
        ], ["nombre"])

        # === app.models.reportes ===
        await seed_table(session, EstadoSincronizacion, [
            {"nombre": "exito", "descripcion": "Sincronización exitosa"},
            {"nombre": "parcial", "descripcion": "Sincronización parcial"},
            {"nombre": "fallo", "descripcion": "Sincronización fallida"},
            {"nombre": "en_proceso", "descripcion": "Sincronización en proceso"},
        ], ["nombre"])

        await session.commit()
        print("Seed de catálogos completado exitosamente.")


if __name__ == "__main__":
    asyncio.run(run_seed())