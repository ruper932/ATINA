from django.contrib import admin

from .models import VwLecturaDetallada, VwDecisionRiegoDetallada, VwAlertaOperativa


from .models import (
    Actuador,
    Alerta,
    Atrapaniebla,
    AuditoriaAccion,
    CalibracionSensor,
    ConfiguracionUmbral,
    DecisionRiego,
    Dispositivo,
    EstadoRiegoActual,
    FuenteAgua,
    Invernadero,
    LecturaSensor,
    NotificacionLocal,
    PerfilUsuario,
    PrediccionML1,
    ReporteSemanal,
    Rol,
    Sensor,
    SimulacionML3,
    SincronizacionMCP,
    TipoActuador,
    TipoDispositivo,
    TipoSensor,
    Ubicacion,
    VwReporteDecisionesInvernaderoFuente,
    VwReporteFuentesUbicacion,
    VwReporteInvernaderosUbicacion,
    VwReporteLecturasSensorTipo,
    VwReporteSensoresTipo,
)


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "descripcion")
    search_fields = ("nombre",)


@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "rol", "estado", "creado_en")
    list_filter = ("estado", "rol")
    search_fields = ("user__username", "user__email", "rol__nombre")
    autocomplete_fields = ("user", "rol")


@admin.register(Ubicacion)
class UbicacionAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "tipo_ubicacion", "parent", "altitud_m")
    list_filter = ("tipo_ubicacion",)
    search_fields = ("nombre", "descripcion")
    autocomplete_fields = ("parent",)


@admin.register(Invernadero)
class InvernaderoAdmin(admin.ModelAdmin):
    list_display = ("id", "codigo", "nombre", "ubicacion", "area_m2", "prioridad_riego", "estado")
    list_filter = ("estado", "prioridad_riego")
    search_fields = ("codigo", "nombre", "descripcion")
    autocomplete_fields = ("ubicacion",)


@admin.register(Atrapaniebla)
class AtrapanieblaAdmin(admin.ModelAdmin):
    list_display = ("id", "codigo", "nombre", "ubicacion", "area_malla_m2", "orientacion", "estado")
    list_filter = ("estado", "orientacion")
    search_fields = ("codigo", "nombre", "tipo_malla")
    autocomplete_fields = ("ubicacion",)


@admin.register(FuenteAgua)
class FuenteAguaAdmin(admin.ModelAdmin):
    list_display = ("id", "codigo", "nombre", "tipo_fuente", "ubicacion", "estado")
    list_filter = ("tipo_fuente", "estado")
    search_fields = ("codigo", "nombre", "descripcion")
    autocomplete_fields = ("ubicacion",)


@admin.register(TipoDispositivo)
class TipoDispositivoAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "descripcion")
    search_fields = ("nombre",)


@admin.register(Dispositivo)
class DispositivoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "codigo",
        "nombre",
        "tipo_dispositivo",
        "ubicacion",
        "fuente_agua",
        "estado",
        "ultima_conexion",
    )
    list_filter = ("estado", "tipo_dispositivo")
    search_fields = ("codigo", "nombre", "identificador_local", "ip_local")
    autocomplete_fields = ("tipo_dispositivo", "ubicacion", "fuente_agua")


@admin.register(TipoSensor)
class TipoSensorAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "variable_medida", "unidad_base")
    search_fields = ("nombre", "variable_medida", "unidad_base")


@admin.register(Sensor)
class SensorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "codigo",
        "nombre",
        "dispositivo",
        "tipo_sensor",
        "estado",
        "fecha_instalacion",
    )
    list_filter = ("estado", "tipo_sensor")
    search_fields = ("codigo", "nombre", "modelo", "numero_serie")
    autocomplete_fields = ("dispositivo", "tipo_sensor")


@admin.register(LecturaSensor)
class LecturaSensorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "sensor",
        "valor",
        "calidad_dato",
        "timestamp_lectura",
        "timestamp_recepcion",
    )
    list_filter = ("calidad_dato", "sensor__tipo_sensor")
    search_fields = ("sensor__codigo", "sensor__nombre")
    autocomplete_fields = ("sensor",)
    date_hierarchy = "timestamp_lectura"


@admin.register(TipoActuador)
class TipoActuadorAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "descripcion")
    search_fields = ("nombre",)


@admin.register(Actuador)
class ActuadorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "codigo",
        "nombre",
        "dispositivo",
        "tipo_actuador",
        "invernadero",
        "estado",
    )
    list_filter = ("estado", "tipo_actuador")
    search_fields = ("codigo", "nombre")
    autocomplete_fields = ("dispositivo", "tipo_actuador", "invernadero")


@admin.register(PrediccionML1)
class PrediccionML1Admin(admin.ModelAdmin):
    list_display = (
        "id",
        "fuente_agua",
        "fecha_prediccion",
        "fecha_objetivo",
        "volumen_predicho_l",
        "confianza_modelo",
        "version_modelo",
    )
    list_filter = ("version_modelo", "fecha_prediccion", "fecha_objetivo")
    search_fields = ("fuente_agua__codigo", "fuente_agua__nombre", "version_modelo")
    autocomplete_fields = ("fuente_agua",)


@admin.register(DecisionRiego)
class DecisionRiegoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "invernadero",
        "actuador",
        "fuente_agua",
        "origen_decision",
        "modo_riego",
        "estado_valvula",
        "ejecutado_en",
    )
    list_filter = ("origen_decision", "modo_riego", "estado_valvula")
    search_fields = ("invernadero__codigo", "decision_texto")
    autocomplete_fields = ("invernadero", "actuador", "fuente_agua")
    date_hierarchy = "ejecutado_en"


@admin.register(EstadoRiegoActual)
class EstadoRiegoActualAdmin(admin.ModelAdmin):
    list_display = ("invernadero", "ultima_decision", "actualizado_en")
    autocomplete_fields = ("invernadero", "ultima_decision")


@admin.register(SimulacionML3)
class SimulacionML3Admin(admin.ModelAdmin):
    list_display = (
        "id",
        "invernadero",
        "fecha_generacion",
        "horizonte_horas",
        "escenario",
        "nivel_riesgo",
        "version_modelo",
    )
    list_filter = ("escenario", "nivel_riesgo", "version_modelo")
    search_fields = ("invernadero__codigo", "descripcion_resultado", "recomendacion")
    autocomplete_fields = ("invernadero",)
    date_hierarchy = "fecha_generacion"


@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tipo_alerta",
        "severidad",
        "origen_alerta",
        "estado_alerta",
        "invernadero",
        "dispositivo",
        "sensor",
        "fecha_generacion",
    )
    list_filter = ("severidad", "origen_alerta", "estado_alerta")
    search_fields = ("tipo_alerta", "mensaje")
    autocomplete_fields = (
        "invernadero",
        "dispositivo",
        "sensor",
        "decision_riego",
        "simulacion_ml3",
        "usuario_reconoce",
    )
    date_hierarchy = "fecha_generacion"


@admin.register(NotificacionLocal)
class NotificacionLocalAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "alerta",
        "tipo_notificacion",
        "estado_envio",
        "fecha_envio",
        "fecha_confirmacion",
    )
    list_filter = ("tipo_notificacion", "estado_envio")
    autocomplete_fields = ("alerta",)


@admin.register(ConfiguracionUmbral)
class ConfiguracionUmbralAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "nombre_parametro",
        "ambito",
        "valor",
        "unidad",
        "invernadero",
        "sensor",
        "editable",
        "actualizado_en",
    )
    list_filter = ("ambito", "editable")
    search_fields = ("nombre_parametro", "descripcion")
    autocomplete_fields = ("invernadero", "sensor", "actualizado_por")


@admin.register(CalibracionSensor)
class CalibracionSensorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "sensor",
        "tipo_calibracion",
        "valor_anterior",
        "valor_nuevo",
        "fecha_calibracion",
        "usuario",
    )
    list_filter = ("tipo_calibracion",)
    search_fields = ("sensor__codigo", "motivo")
    autocomplete_fields = ("sensor", "usuario")
    date_hierarchy = "fecha_calibracion"


@admin.register(SincronizacionMCP)
class SincronizacionMCPAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "dispositivo",
        "origen",
        "destino",
        "tipo_recurso",
        "estado_sincronizacion",
        "cantidad_registros",
        "fecha_inicio",
        "fecha_fin",
    )
    list_filter = ("estado_sincronizacion", "tipo_recurso", "origen", "destino")
    search_fields = ("mensaje_resultado",)
    autocomplete_fields = ("dispositivo",)
    date_hierarchy = "fecha_inicio"


@admin.register(AuditoriaAccion)
class AuditoriaAccionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "usuario",
        "accion",
        "entidad_afectada",
        "entidad_id",
        "ip_origen",
        "fecha_accion",
    )
    list_filter = ("accion", "entidad_afectada")
    search_fields = ("accion", "entidad_afectada")
    autocomplete_fields = ("usuario",)
    date_hierarchy = "fecha_accion"


@admin.register(ReporteSemanal)
class ReporteSemanalAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "periodo_inicio",
        "periodo_fin",
        "volumen_captado_l",
        "volumen_predicho_l",
        "eficiencia_riego",
        "total_alertas",
        "generado_por",
        "fecha_generacion",
    )
    list_filter = ("periodo_inicio", "periodo_fin")
    search_fields = ("resumen",)
    autocomplete_fields = ("generado_por",)
    date_hierarchy = "fecha_generacion"


@admin.register(VwLecturaDetallada)
class VwLecturaDetalladaAdmin(admin.ModelAdmin):
    list_display = (
        "lectura_id",
        "timestamp_lectura",
        "sensor_codigo",
        "sensor_nombre",
        "tipo_sensor",
        "valor",
        "unidad_base",
        "dispositivo_codigo",
    )
    list_filter = ("calidad_dato", "tipo_sensor", "dispositivo_codigo")
    search_fields = ("sensor_codigo", "sensor_nombre", "dispositivo_codigo")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(VwDecisionRiegoDetallada)
class VwDecisionRiegoDetalladaAdmin(admin.ModelAdmin):
    list_display = (
        "decision_id",
        "ejecutado_en",
        "invernadero_codigo",
        "fuente_codigo",
        "origen_decision",
        "modo_riego",
        "estado_valvula",
        "volumen_aplicado_l",
    )
    list_filter = ("origen_decision", "modo_riego", "estado_valvula")
    search_fields = ("invernadero_codigo", "fuente_codigo")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(VwAlertaOperativa)
class VwAlertaOperativaAdmin(admin.ModelAdmin):
    list_display = (
        "alerta_id",
        "fecha_generacion",
        "tipo_alerta",
        "severidad",
        "origen_alerta",
        "estado_alerta",
        "invernadero_codigo",
        "dispositivo_codigo",
        "sensor_codigo",
    )
    list_filter = ("severidad", "origen_alerta", "estado_alerta")
    search_fields = ("tipo_alerta", "invernadero_codigo", "sensor_codigo", "dispositivo_codigo")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(VwReporteInvernaderosUbicacion)
class VwReporteInvernaderosUbicacionAdmin(admin.ModelAdmin):
    list_display = (
        "codigo",
        "nombre",
        "ubicacion_nombre",
        "tipo_ubicacion",
        "area_m2",
        "prioridad_riego",
        "estado",
    )
    search_fields = ("codigo", "nombre", "ubicacion_nombre")
    list_filter = ("estado", "tipo_ubicacion")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(VwReporteSensoresTipo)
class VwReporteSensoresTipoAdmin(admin.ModelAdmin):
    list_display = (
        "codigo",
        "nombre",
        "tipo_sensor_nombre",
        "variable_medida",
        "unidad_base",
        "estado",
    )
    search_fields = ("codigo", "nombre", "tipo_sensor_nombre")
    list_filter = ("estado", "tipo_sensor_nombre")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(VwReporteFuentesUbicacion)
class VwReporteFuentesUbicacionAdmin(admin.ModelAdmin):
    list_display = (
        "codigo",
        "nombre",
        "tipo_fuente",
        "ubicacion_nombre",
        "capacidad_l",
        "estado",
    )
    search_fields = ("codigo", "nombre", "ubicacion_nombre")
    list_filter = ("tipo_fuente", "estado")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(VwReporteLecturasSensorTipo)
class VwReporteLecturasSensorTipoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "timestamp_lectura",
        "sensor_codigo",
        "sensor_nombre",
        "tipo_sensor_nombre",
        "valor",
        "unidad_base",
        "calidad_dato",
    )
    search_fields = ("sensor_codigo", "sensor_nombre", "tipo_sensor_nombre")
    list_filter = ("calidad_dato", "tipo_sensor_nombre")
    date_hierarchy = "timestamp_lectura"

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(VwReporteDecisionesInvernaderoFuente)
class VwReporteDecisionesInvernaderoFuenteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "ejecutado_en",
        "invernadero_codigo",
        "invernadero_nombre",
        "fuente_codigo",
        "fuente_nombre",
        "origen_decision",
        "modo_riego",
        "estado_valvula",
    )
    search_fields = ("invernadero_codigo", "invernadero_nombre", "fuente_codigo", "fuente_nombre")
    list_filter = ("origen_decision", "modo_riego", "estado_valvula", "tipo_fuente")
    date_hierarchy = "ejecutado_en"

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False