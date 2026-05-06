# app/crud/crud_invernadero.py
from app.crud.base import CRUDBase
from app.models.infraestructura import Invernadero
from app.schemas.infraestructura import InvernaderoCreate, InvernaderoUpdate

class CRUDInvernadero(CRUDBase[Invernadero, InvernaderoCreate, InvernaderoUpdate]):
    # Aquí puedes agregar métodos específicos si los necesitas, 
    # por ejemplo: async def get_by_codigo(self, db, codigo: str)
    pass

invernadero = CRUDInvernadero(Invernadero)