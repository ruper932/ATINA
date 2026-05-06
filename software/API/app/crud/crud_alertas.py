# app/crud/crud_alertas.py
from app.crud.base import CRUDBase
from app.models.alertas import Alerta, NotificacionLocal
from app.schemas.alertas import (
    AlertaCreate, AlertaUpdate,
    NotificacionLocalCreate, NotificacionLocalUpdate
)

class CRUDAlerta(CRUDBase[Alerta, AlertaCreate, AlertaUpdate]): pass
class CRUDNotificacionLocal(CRUDBase[NotificacionLocal, NotificacionLocalCreate, NotificacionLocalUpdate]): pass

alerta = CRUDAlerta(Alerta)
notificacion_local = CRUDNotificacionLocal(NotificacionLocal)