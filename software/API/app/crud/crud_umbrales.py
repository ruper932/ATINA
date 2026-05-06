# app/crud/crud_umbrales.py
from app.crud.base import CRUDBase
from app.models.umbrales import ParametroUmbral, ConfiguracionUmbral
from app.schemas.umbrales import (
    ParametroUmbralCreate, ParametroUmbralUpdate,
    ConfiguracionUmbralCreate, ConfiguracionUmbralUpdate
)

class CRUDParametroUmbral(CRUDBase[ParametroUmbral, ParametroUmbralCreate, ParametroUmbralUpdate]): pass
class CRUDConfiguracionUmbral(CRUDBase[ConfiguracionUmbral, ConfiguracionUmbralCreate, ConfiguracionUmbralUpdate]): pass

parametro_umbral = CRUDParametroUmbral(ParametroUmbral)
configuracion_umbral = CRUDConfiguracionUmbral(ConfiguracionUmbral)