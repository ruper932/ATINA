# app/crud/crud_reportes.py
from app.crud.base import CRUDBase
from app.models.reportes import SincronizacionMCP, ReporteSemanal
from app.schemas.reportes import (
    SincronizacionMCPCreate,
    SincronizacionMCPUpdate,
    ReporteSemanalCreate,
    ReporteSemanalUpdate,
)

class CRUDSincronizacionMCP(CRUDBase[SincronizacionMCP, SincronizacionMCPCreate, SincronizacionMCPUpdate]): pass
class CRUDReporteSemanal(CRUDBase[ReporteSemanal, ReporteSemanalCreate, ReporteSemanalUpdate]):
    pass

sincronizacion_mcp = CRUDSincronizacionMCP(SincronizacionMCP)
reporte_semanal = CRUDReporteSemanal(ReporteSemanal)