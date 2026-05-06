# app/crud/crud_infraestructura.py
from app.crud.base import CRUDBase
from app.models.infraestructura import Ubicacion, Invernadero, Atrapaniebla, FuenteAgua
from app.schemas.infraestructura import (
    UbicacionCreate, UbicacionUpdate,
    InvernaderoCreate, InvernaderoUpdate,
    AtrapanieblaCreate, AtrapanieblaUpdate,
    FuenteAguaCreate, FuenteAguaUpdate
)

class CRUDUbicacion(CRUDBase[Ubicacion, UbicacionCreate, UbicacionUpdate]): pass
class CRUDInvernadero(CRUDBase[Invernadero, InvernaderoCreate, InvernaderoUpdate]): pass
class CRUDAtrapaniebla(CRUDBase[Atrapaniebla, AtrapanieblaCreate, AtrapanieblaUpdate]): pass
class CRUDFuenteAgua(CRUDBase[FuenteAgua, FuenteAguaCreate, FuenteAguaUpdate]): pass

ubicacion = CRUDUbicacion(Ubicacion)
invernadero = CRUDInvernadero(Invernadero)
atrapaniebla = CRUDAtrapaniebla(Atrapaniebla)
fuente_agua = CRUDFuenteAgua(FuenteAgua)