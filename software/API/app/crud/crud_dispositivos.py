# app/crud/crud_dispositivos.py
from app.crud.base import CRUDBase
from app.models.dispositivos import Dispositivo, Sensor, LecturaSensor, Actuador
from app.schemas.dispositivos import (
    DispositivoCreate, DispositivoUpdate,
    SensorCreate, SensorUpdate,
    LecturaSensorCreate, LecturaSensorCreate, # Lecturas rara vez se actualizan
    ActuadorCreate, ActuadorUpdate
)

class CRUDDispositivo(CRUDBase[Dispositivo, DispositivoCreate, DispositivoUpdate]): pass
class CRUDSensor(CRUDBase[Sensor, SensorCreate, SensorUpdate]): pass
class CRUDLecturaSensor(CRUDBase[LecturaSensor, LecturaSensorCreate, LecturaSensorCreate]): pass
class CRUDActuador(CRUDBase[Actuador, ActuadorCreate, ActuadorUpdate]): pass

dispositivo = CRUDDispositivo(Dispositivo)
sensor = CRUDSensor(Sensor)
lectura_sensor = CRUDLecturaSensor(LecturaSensor)
actuador = CRUDActuador(Actuador)