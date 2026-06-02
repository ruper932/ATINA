import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ticketsMantenimientoService } from '@/services/tickets-mantenimiento.service';
import { TicketMantenimiento, TicketMantenimientoCreate } from '@/types/ticket-mantenimiento';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  UserCheck,
  Plus,
  AlertCircle,
  Download,
  FileSpreadsheet,
  FileJson,
  Eye,
  Calendar,
  MessageSquare,
  History,
  User,
  Info,
  MapPin,
  Cpu,
  Thermometer,
  Droplets,
} from 'lucide-react';

// IMPORTACIONES PARA EL FETCH DINÁMICO
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

// Configuración de estados (para estética)
const estadoConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
  },
  en_revision: {
    label: "En revisión",
    icon: UserCheck,
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
  },
  terminado: {
    label: "Terminado",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
  },
  cancelado: {
    label: "Cancelado",
    icon: XCircle,
    color: "text-rose-700",
    bgColor: "bg-rose-50 border-rose-200",
  },
};

const resultadoConfig: Record<string, { label: string; icon: any; color: string }> = {
  danado: {
    label: "Dañado",
    icon: AlertCircle,
    color: "text-rose-700",
  },
  mantenimiento: {
    label: "Mantenimiento",
    icon: Wrench,
    color: "text-blue-700",
  },
  sin_falla: {
    label: "Sin falla",
    icon: CheckCircle2,
    color: "text-emerald-700",
  },
};

// Función para formatear fechas
function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

// Función para exportar a CSV
function exportToCSV(data: TicketMantenimiento[], filename: string) {
  const headers = ["ID", "Tipo", "Recurso", "Reportante", "Estado", "Fecha reporte", "Técnico", "Resultado"];
  const rows = data.map((item) => [
    item.id,
    item.tipo_recurso,
    item.recurso_id,
    item.reportante_ci,
    estadoConfig[item.estado]?.label ?? item.estado,
    formatDate(item.fecha_reporte),
    item.tecnico_ci || "-",
    item.resultado_revision ? resultadoConfig[item.resultado_revision]?.label ?? item.resultado_revision : "-",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Función para exportar a Excel
function exportToExcel(data: TicketMantenimiento[], filename: string) {
  const headers = ["ID", "Tipo", "Recurso", "Reportante", "Estado", "Fecha reporte", "Técnico", "Resultado"];
  const rows = data.map((item) => [
    item.id,
    item.tipo_recurso,
    item.recurso_id,
    item.reportante_ci,
    estadoConfig[item.estado]?.label ?? item.estado,
    formatDate(item.fecha_reporte),
    item.tecnico_ci || "-",
    item.resultado_revision ? resultadoConfig[item.resultado_revision]?.label ?? item.resultado_revision : "-",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute("download", `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Función para exportar a PDF
function exportToPDF(data: TicketMantenimiento[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const styles = `
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; margin: 2rem; }
      h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; }
      p { color: #6b7280; margin-bottom: 1.5rem; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; padding: 0.75rem; background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb; font-weight: 600; }
      td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
      .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
      .badge-pendiente { background: #fef3c7; color: #b45309; }
      .badge-en_revision { background: #dbeafe; color: #1d4ed8; }
      .badge-terminado { background: #d1fae5; color: #047857; }
      .badge-cancelado { background: #ffe4e6; color: #e11d48; }
    </style>
  `;

  const tableRows = data
    .map(
      (item) => `
      <tr>
        <td>${item.id}</td>
        <td>${item.tipo_recurso}</td>
        <td>${item.recurso_id}</td>
        <td>${item.reportante_ci}</td>
        <td><span class="badge badge-${item.estado}">${estadoConfig[item.estado]?.label ?? item.estado}</span></td>
        <td>${formatDate(item.fecha_reporte)}</td>
        <td>${item.tecnico_ci || "-"}</td>
      </tr>
    `
    )
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reporte de Tickets</title>
        ${styles}
      </head>
      <body>
        <h1>Reporte de Tickets de Mantenimiento</h1>
        <p>Generado el ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr><th>ID</th><th>Tipo</th><th>Recurso</th><th>Reportante</th><th>Estado</th><th>Fecha reporte</th><th>Técnico</th></tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.print();
}

// Componente de detalle del ticket
function TicketDetailDialog({ 
  open, 
  onOpenChange, 
  ticket, 
  onRefresh 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  ticket: TicketMantenimiento | null; 
  onRefresh: () => void;
}) {
  const { user, role } = useAuth();
  const isAdminOrTech = role === 'admin' || role === 'tecnico';
  
  const [detalleTicket, setDetalleTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cancelarComentario, setCancelarComentario] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (open && ticket) {
      fetchDetalle();
    }
  }, [open, ticket]);

  const fetchDetalle = async () => {
    try {
      setLoading(true);
      const data = await ticketsMantenimientoService.obtener(ticket!.id);
      setDetalleTicket(data);
    } catch (error) {
      console.error('Error cargando detalle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!ticket) return;
    try {
      await ticketsMantenimientoService.cancelar(ticket.id, { comentario: cancelarComentario || undefined });
      setShowCancelDialog(false);
      setCancelarComentario("");
      onRefresh();
      onOpenChange(false);
    } catch (error) {
      console.error('Error cancelando ticket:', error);
    }
  };

  const handleTomar = async () => {
    if (!ticket) return;
    try {
      await ticketsMantenimientoService.tomarRevision(ticket.id, {});
      onRefresh();
      fetchDetalle();
    } catch (error) {
      console.error('Error tomando ticket:', error);
    }
  };

  const canTake = ticket?.estado === "pendiente" && isAdminOrTech;
  const canCancel = ticket?.estado === "pendiente" && ticket?.reportante_ci === user;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 sm:max-w-3xl">
          <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
            <DialogTitle className="text-xl">Ticket #{ticket?.id ?? "—"}</DialogTitle>
            <DialogDescription>Detalle completo e historial del ticket de mantenimiento</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando detalle...</div>
          ) : detalleTicket ? (
            <div className="space-y-6 pt-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Estado</p>
                  <div className="mt-2">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${estadoConfig[detalleTicket.estado]?.bgColor || "bg-zinc-50 border-zinc-200"} ${estadoConfig[detalleTicket.estado]?.color || "text-zinc-600"}`}
                    >
                      {(() => {
                        const Icon = estadoConfig[detalleTicket.estado]?.icon || AlertCircle;
                        return <Icon className="h-3 w-3" />;
                      })()}
                      {estadoConfig[detalleTicket.estado]?.label ?? detalleTicket.estado}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Tipo de recurso</p>
                  <p className="mt-2 text-sm font-medium capitalize">{detalleTicket.tipo_recurso}</p>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Recurso ID</p>
                  <p className="mt-2 text-sm font-medium">{detalleTicket.recurso_id}</p>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Reportante</p>
                  <p className="mt-2 text-sm font-medium">{detalleTicket.reportante_ci}</p>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Técnico asignado</p>
                  <p className="mt-2 text-sm font-medium">{detalleTicket.tecnico_ci || "—"}</p>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Resultado</p>
                  <p className="mt-2 text-sm font-medium">
                    {detalleTicket.resultado_revision ? (
                      <span className={`inline-flex items-center gap-1 ${resultadoConfig[detalleTicket.resultado_revision]?.color || "text-zinc-600"}`}>
                        {(() => {
                          const Icon = resultadoConfig[detalleTicket.resultado_revision]?.icon || AlertCircle;
                          return <Icon className="h-3 w-3" />;
                        })()}
                        {resultadoConfig[detalleTicket.resultado_revision]?.label ?? detalleTicket.resultado_revision}
                      </span>
                    ) : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Fecha reporte</p>
                  <p className="mt-2 text-sm font-medium">{formatDate(detalleTicket.fecha_reporte)}</p>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Fecha cierre</p>
                  <p className="mt-2 text-sm font-medium">{formatDate(detalleTicket.fecha_cierre)}</p>
                </div>
              </div>

              <Separator className="border-border/70" />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Descripción del problema</h3>
                </div>
                <p className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm">
                  {detalleTicket.descripcion_problema}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Observación técnica</h3>
                </div>
                <p className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm">
                  {detalleTicket.observacion_tecnica || "—"}
                </p>
              </div>

              <Separator className="border-border/70" />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Historial de cambios</h3>
                </div>

                {detalleTicket.historial && detalleTicket.historial.length > 0 ? (
                  <div className="space-y-3">
                    {detalleTicket.historial.map((item: any, index: number) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border border-border/70 p-4 ${index !== detalleTicket.historial.length - 1 ? "border-b" : ""}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${estadoConfig[item.estado_nuevo]?.bgColor || "bg-zinc-50 border-zinc-200"} ${estadoConfig[item.estado_nuevo]?.color || "text-zinc-600"}`}
                          >
                            {(() => {
                              const Icon = estadoConfig[item.estado_nuevo]?.icon || AlertCircle;
                              return <Icon className="h-3 w-3" />;
                            })()}
                            {estadoConfig[item.estado_nuevo]?.label ?? item.estado_nuevo}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.creado_en)}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>
                            <span className="font-medium">Actor:</span> {item.actor_ci || "—"}
                          </span>
                        </div>

                        {item.comentario && (
                          <div className="mt-2 flex items-start gap-2 text-sm">
                            <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{item.comentario}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-border/70 bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                    Sin historial registrado
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
                {canTake && (
                  <Button onClick={handleTomar}>
                    Tomar revisión
                  </Button>
                )}
                {canCancel && (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Cancelar ticket
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-rose-600">
              Error al cargar el detalle
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de cancelación */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="border-border/70 sm:max-w-md">
          <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
            <DialogTitle className="text-xl">Cancelar ticket</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar este ticket?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Comentario (opcional)</Label>
              <Textarea
                rows={3}
                value={cancelarComentario}
                onChange={(e) => setCancelarComentario(e.target.value)}
                placeholder="Explica el motivo de la cancelación"
                className="rounded-xl border-border/70"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="rounded-xl">
                Volver
              </Button>
              <Button variant="destructive" onClick={handleCancelar} className="rounded-xl">
                Confirmar cancelación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function TicketsMantenimientoPage() {
  const { user, role } = useAuth();
  const isAdminOrTech = role === 'admin' || role === 'tecnico';
  const isDocente = role === 'docente';
  
  const [tickets, setTickets] = useState<TicketMantenimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketMantenimiento | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos");

  const [newTicket, setNewTicket] = useState<TicketMantenimientoCreate>({
    tipo_recurso: 'dispositivo',
    recurso_id: 0,
    descripcion_problema: ''
  });

  const [resolveForm, setResolveForm] = useState({
    resultado_revision: 'mantenimiento' as any,
    observacion_tecnica: ''
  });

  // Estado para almacenar información adicional del recurso seleccionado
  const [recursoInfo, setRecursoInfo] = useState<any>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketsMantenimientoService.listar();
      setTickets(data);
    } catch (error) {
      console.error('Error cargando tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------
  // LÓGICA DE FETCH DINÁMICO PARA LOS RECURSOS
  // --------------------------------------------------------
  const { data: opcionesRecurso = [], isLoading: cargandoRecursos } = useQuery({
    queryKey: ['recursos-opciones', newTicket.tipo_recurso],
    queryFn: async () => {
      let endpoint = '';
      
      switch (newTicket.tipo_recurso) {
        case 'dispositivo':
          endpoint = '/iot';
          break;
        case 'sensor':
          endpoint = '/iot/sensores';
          break;
        case 'actuador':
          endpoint = '/iot/actuadores';
          break;
        default:
          return [];
      }

      const response = await apiClient.get(endpoint);
      return response.data;
    },
    enabled: !!newTicket.tipo_recurso && isCreateOpen,
  });

  // Obtener información detallada del recurso seleccionado
  const { data: recursoDetalle, refetch: refetchRecursoDetalle } = useQuery({
    queryKey: ['recurso-detalle', newTicket.tipo_recurso, newTicket.recurso_id],
    queryFn: async () => {
      if (!newTicket.recurso_id) return null;
      let endpoint = '';
      switch (newTicket.tipo_recurso) {
        case 'dispositivo':
          endpoint = `/iot/${newTicket.recurso_id}`;
          break;
        case 'sensor':
          endpoint = `/iot/sensores/${newTicket.recurso_id}`;
          break;
        case 'actuador':
          endpoint = `/iot/actuadores/${newTicket.recurso_id}`;
          break;
        default:
          return null;
      }
      try {
        const response = await apiClient.get(endpoint);
        return response.data;
      } catch (error) {
        console.error('Error obteniendo detalle del recurso:', error);
        return null;
      }
    },
    enabled: !!newTicket.recurso_id && isCreateOpen,
  });

  useEffect(() => {
    if (recursoDetalle) {
      setRecursoInfo(recursoDetalle);
    } else {
      setRecursoInfo(null);
    }
  }, [recursoDetalle]);

  // Limpiar el recurso seleccionado al cambiar el tipo
  useEffect(() => {
    setNewTicket(prev => ({ ...prev, recurso_id: 0 }));
    setRecursoInfo(null);
  }, [newTicket.tipo_recurso]);
  // --------------------------------------------------------

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ticketsMantenimientoService.crear(newTicket);
      setIsCreateOpen(false);
      fetchTickets();
      setNewTicket({ tipo_recurso: 'dispositivo', recurso_id: 0, descripcion_problema: '' });
      setRecursoInfo(null);
    } catch (error) {
      console.error('Error creando ticket:', error);
    }
  };

  const handleTomar = async (id: number) => {
    try {
      await ticketsMantenimientoService.tomarRevision(id, {});
      fetchTickets();
    } catch (error) {
      console.error('Error tomando ticket:', error);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await ticketsMantenimientoService.resolver(selectedTicket.id, resolveForm);
      setIsResolveOpen(false);
      fetchTickets();
      setResolveForm({ resultado_revision: 'mantenimiento', observacion_tecnica: '' });
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error resolviendo ticket:', error);
    }
  };

  const handleCancelar = async (id: number) => {
    try {
      await ticketsMantenimientoService.cancelar(id, {});
      fetchTickets();
    } catch (error) {
      console.error('Error cancelando ticket:', error);
    }
  };

  // Filtrado en tiempo real
  const filteredTickets = tickets.filter((ticket) => {
    const matchesEstado = estadoFiltro === "todos" || ticket.estado === estadoFiltro;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesEstado;
    
    return matchesEstado && (
      String(ticket.id).includes(term) ||
      ticket.tipo_recurso.toLowerCase().includes(term) ||
      String(ticket.recurso_id).includes(term) ||
      ticket.reportante_ci.toLowerCase().includes(term) ||
      (ticket.tecnico_ci?.toLowerCase().includes(term) ?? false) ||
      ticket.estado.toLowerCase().includes(term)
    );
  });

  // Estadísticas
  const stats = {
    total: filteredTickets.length,
    pendiente: filteredTickets.filter((t) => t.estado === "pendiente").length,
    en_revision: filteredTickets.filter((t) => t.estado === "en_revision").length,
    terminado: filteredTickets.filter((t) => t.estado === "terminado").length,
    cancelado: filteredTickets.filter((t) => t.estado === "cancelado").length,
  };

  const handleExportCSV = () => {
    exportToCSV(filteredTickets, `tickets_${new Date().toISOString().split("T")[0]}`);
  };

  const handleExportExcel = () => {
    exportToExcel(filteredTickets, `tickets_${new Date().toISOString().split("T")[0]}`);
  };

  const handleExportPDF = () => {
    exportToPDF(filteredTickets);
  };

  const canCancel = (ticket: TicketMantenimiento) => {
    return isDocente && ticket.estado === "pendiente" && ticket.reportante_ci === user;
  };

  // Renderizar información del recurso seleccionado
  const renderRecursoInfo = () => {
    if (!recursoInfo) return null;
    
    return (
      <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Info className="h-4 w-4" />
          Información del recurso seleccionado
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p className="text-muted-foreground">Código:</p>
          <p className="font-medium">{recursoInfo.codigo || "—"}</p>
          
          <p className="text-muted-foreground">Nombre:</p>
          <p className="font-medium">{recursoInfo.nombre || "—"}</p>
          
          {recursoInfo.estado_dispositivo_nombre && (
            <>
              <p className="text-muted-foreground">Estado:</p>
              <p className="font-medium">{recursoInfo.estado_dispositivo_nombre}</p>
            </>
          )}
          
          {recursoInfo.tipo_dispositivo_nombre && (
            <>
              <p className="text-muted-foreground">Tipo:</p>
              <p className="font-medium">{recursoInfo.tipo_dispositivo_nombre}</p>
            </>
          )}
          
          {recursoInfo.ubicacion_nombre && (
            <>
              <p className="text-muted-foreground">Ubicación:</p>
              <p className="font-medium">{recursoInfo.ubicacion_nombre}</p>
            </>
          )}
          
          {recursoInfo.modelo && (
            <>
              <p className="text-muted-foreground">Modelo:</p>
              <p className="font-medium">{recursoInfo.modelo}</p>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Sección de cabecera y estadísticas */}
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Tickets de Mantenimiento
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Gestiona los reportes de fallas y mantenimiento de dispositivos, sensores y actuadores.
              Los docentes reportan problemas, el equipo técnico los revisa y resuelve.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="rounded-xl border-border/70">
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={handleExportExcel} className="rounded-xl border-border/70">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="rounded-xl border-border/70">
              <FileJson className="mr-2 h-4 w-4" />
              PDF
            </Button>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 sm:max-w-2xl">
                <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
                  <DialogTitle className="text-xl">Crear Nuevo Ticket</DialogTitle>
                  <DialogDescription>
                    Reporta una falla o problema en un dispositivo, sensor o actuador
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-6 pt-2">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tipo de Recurso</Label>
                      <Select 
                        value={newTicket.tipo_recurso} 
                        onValueChange={(v: any) => setNewTicket({...newTicket, tipo_recurso: v})}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/70">
                          <SelectItem value="dispositivo">Dispositivo</SelectItem>
                          <SelectItem value="sensor">Sensor</SelectItem>
                          <SelectItem value="actuador">Actuador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Recurso Específico</Label>
                      <Select
                        value={newTicket.recurso_id ? newTicket.recurso_id.toString() : ''}
                        onValueChange={(v) => {
                          setNewTicket({...newTicket, recurso_id: parseInt(v)});
                          refetchRecursoDetalle();
                        }}
                        disabled={cargandoRecursos || !newTicket.tipo_recurso}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/70">
                          <SelectValue placeholder={
                            cargandoRecursos ? "Cargando opciones..." : "Seleccione el recurso..."
                          } />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/70">
                          {opcionesRecurso.map((item: any) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.codigo} - {item.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {renderRecursoInfo()}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Descripción del Problema</Label>
                    <Textarea 
                      rows={4}
                      className="rounded-xl border-border/70"
                      value={newTicket.descripcion_problema} 
                      onChange={(e) => setNewTicket({...newTicket, descripcion_problema: e.target.value})}
                      required
                      placeholder="Describe detalladamente el problema o falla que has detectado"
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl border-border/70">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={!newTicket.recurso_id || cargandoRecursos} className="rounded-xl">
                      Reportar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid gap-3 border-t border-border/70 px-6 py-5 md:grid-cols-5">
          <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-amber-700">Pendientes</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{stats.pendiente}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-blue-700">En revisión</p>
            <p className="mt-1 text-2xl font-semibold text-blue-700">{stats.en_revision}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-emerald-700">Terminados</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">{stats.terminado}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-rose-700">Cancelados</p>
            <p className="mt-1 text-2xl font-semibold text-rose-700">{stats.cancelado}</p>
          </div>
        </div>
      </section>

      {/* Tabla de tickets */}
      <section className="rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/70 px-5 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={estadoFiltro === "todos" ? "default" : "outline"}
                onClick={() => setEstadoFiltro("todos")}
                className="rounded-lg"
              >
                Todos
              </Button>
              <Button
                variant={estadoFiltro === "pendiente" ? "default" : "outline"}
                onClick={() => setEstadoFiltro("pendiente")}
                className="rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
              >
                <Clock className="mr-2 h-4 w-4" />
                Pendientes
              </Button>
              <Button
                variant={estadoFiltro === "en_revision" ? "default" : "outline"}
                onClick={() => setEstadoFiltro("en_revision")}
                className="rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                En revisión
              </Button>
              <Button
                variant={estadoFiltro === "terminado" ? "default" : "outline"}
                onClick={() => setEstadoFiltro("terminado")}
                className="rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Terminados
              </Button>
              <Button
                variant={estadoFiltro === "cancelado" ? "default" : "outline"}
                onClick={() => setEstadoFiltro("cancelado")}
                className="rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelados
              </Button>
            </div>

            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Buscar por ID, tipo, recurso, reportante, técnico o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-xl border border-border/70 bg-background px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="h-12">ID</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>Reportante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                    Cargando tickets...
                  </TableCell>
                </TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Wrench className="h-6 w-6" />
                      <p className="text-sm font-medium text-foreground">
                        {searchTerm ? "No hay coincidencias para tu búsqueda" : "No hay tickets registrados"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => {
                  const Icon = estadoConfig[ticket.estado]?.icon || AlertCircle;
                  const estado = estadoConfig[ticket.estado] || {
                    label: ticket.estado.replace('_', ' '),
                    color: "text-zinc-600",
                    bgColor: "bg-zinc-50 border-zinc-200",
                  };
                  return (
                    <TableRow key={ticket.id} className="transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium">#{ticket.id}</TableCell>
                      <TableCell className="capitalize">{ticket.tipo_recurso} ({ticket.recurso_id})</TableCell>
                      <TableCell>{ticket.reportante_ci}</TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${estado.bgColor} ${estado.color}`}
                        >
                          <Icon className="h-3 w-3" />
                          {estado.label}
                        </div>
                      </TableCell>
                      <TableCell>{ticket.tecnico_ci || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(ticket.fecha_reporte).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setIsDetailOpen(true);
                            }}
                            className="rounded-lg"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {isAdminOrTech && ticket.estado === 'pendiente' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleTomar(ticket.id)}
                              className="rounded-lg"
                            >
                              Tomar
                            </Button>
                          )}

                          {isAdminOrTech && ticket.estado === 'en_revision' && ticket.tecnico_ci === user && (
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setIsResolveOpen(true);
                              }}
                              className="rounded-lg"
                            >
                              Resolver
                            </Button>
                          )}

                          {canCancel(ticket) && (
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleCancelar(ticket.id)}
                              className="rounded-lg"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Modal de Detalle del Ticket */}
      <TicketDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        ticket={selectedTicket}
        onRefresh={fetchTickets}
      />

      {/* Modal para Resolver */}
      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 sm:max-w-2xl">
          <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
            <DialogTitle className="text-xl">Resolver Ticket #{selectedTicket?.id}</DialogTitle>
            <DialogDescription>
              Indica el resultado de la revisión y añade una observación técnica
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResolve} className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Resultado de la Revisión</Label>
              <Select 
                value={resolveForm.resultado_revision} 
                onValueChange={(v: any) => setResolveForm({...resolveForm, resultado_revision: v})}
              >
                <SelectTrigger className="h-11 rounded-xl border-border/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/70">
                  <SelectItem value="danado">Dañado (Requiere reemplazo)</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento (Reparado/Ajustado)</SelectItem>
                  <SelectItem value="sin_falla">Sin Falla</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Observación Técnica</Label>
              <Textarea 
                rows={4}
                className="rounded-xl border-border/70"
                value={resolveForm.observacion_tecnica} 
                onChange={(e) => setResolveForm({...resolveForm, observacion_tecnica: e.target.value})}
                required
                placeholder="Detalla qué trabajo se realizó o por qué está dañado..."
              />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsResolveOpen(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl">Cerrar Ticket</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}