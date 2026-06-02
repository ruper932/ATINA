import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  Eye,
  FileText,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Calendar,
  MessageSquare,
  FileCheck,
  History,
  ExternalLink,
  Download,
  FileSpreadsheet,
  FileJson,
} from "lucide-react";

import { solicitudesService } from "@/services/solicitudes.service";
import { ubicacionesService } from "@/services/ubicaciones.service";
import { atrapanieblasService } from "@/services/atrapanieblas.service";
import { fuentesAguaService } from "@/services/fuentesAgua.service";
import { usersService } from "@/services/users.service"; // Asegúrate de tener este servicio
import { useAuth } from "@/hooks/useAuth";

import type {
  CrearSolicitudPayload,
  EstadoSolicitud,
  ResolverSolicitudPayload,
  SolicitudMovimiento,
  SolicitudMovimientoDetail,
  TipoRecursoSolicitud,
} from "@/types/solicitud";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type CreateFormValues = {
  tipo_recurso: TipoRecursoSolicitud;
  recurso_id: number;
  ubicacion_destino_id?: number;
  ubicacion_destino_propuesta?: string;
  motivo: string;
  pdf_url?: string;
};

type ResolverFormValues = {
  aprobar: "si" | "no";
  observacion: string;
  ubicacion_destino_id?: number;
  pdf_url?: string;
};

const estadoConfig: Record<
  EstadoSolicitud,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
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
  aprobada: {
    label: "Aprobada",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
  },
  rechazada: {
    label: "Rechazada",
    icon: XCircle,
    color: "text-rose-700",
    bgColor: "bg-rose-50 border-rose-200",
  },
  cancelada: {
    label: "Cancelada",
    icon: AlertCircle,
    color: "text-zinc-600",
    bgColor: "bg-zinc-50 border-zinc-200",
  },
};

const tipoLabel: Record<TipoRecursoSolicitud, string> = {
  atrapaniebla: "Atrapaniebla",
  fuenteagua: "Fuente de agua",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function normalizeError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as { response?: { data?: { detail?: unknown } } }).response;
    const detail = response?.data?.detail;

    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((item: { msg?: string }) => item?.msg ?? "Error de validación").join(", ");
    }
  }

  return "Ocurrió un error inesperado";
}

// Función para exportar a CSV (muestra código del recurso, nombre ubicación y nombre solicitante)
function exportToCSV(
  data: SolicitudMovimiento[],
  recursoCodigoMap: Map<number, string>,
  ubicacionNombreMap: Map<number, string>,
  solicitanteNombreMap: Map<string, string>,
  filename: string
) {
  const headers = ["ID", "Tipo", "Recurso", "Solicitante", "Estado", "Fecha creación"];
  const rows = data.map((item) => [
    item.id,
    tipoLabel[item.tipo_recurso],
    recursoCodigoMap.get(item.recurso_id) ?? item.recurso_id,
    solicitanteNombreMap.get(item.solicitante_ci) ?? item.solicitante_ci,
    estadoConfig[item.estado].label,
    formatDate(item.fecha_creacion),
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
function exportToExcel(
  data: SolicitudMovimiento[],
  recursoCodigoMap: Map<number, string>,
  ubicacionNombreMap: Map<number, string>,
  solicitanteNombreMap: Map<string, string>,
  filename: string
) {
  const headers = ["ID", "Tipo", "Recurso", "Solicitante", "Estado", "Fecha creación"];
  const rows = data.map((item) => [
    item.id,
    tipoLabel[item.tipo_recurso],
    recursoCodigoMap.get(item.recurso_id) ?? item.recurso_id,
    solicitanteNombreMap.get(item.solicitante_ci) ?? item.solicitante_ci,
    estadoConfig[item.estado].label,
    formatDate(item.fecha_creacion),
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
function exportToPDF(
  data: SolicitudMovimiento[],
  recursoCodigoMap: Map<number, string>,
  solicitanteNombreMap: Map<string, string>
) {
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
      .badge-aprobada { background: #d1fae5; color: #047857; }
      .badge-rechazada { background: #ffe4e6; color: #e11d48; }
      .badge-cancelada { background: #f4f4f5; color: #52525b; }
    </style>
  `;

  const tableRows = data
    .map(
      (item) => `
      <tr>
        <td>${item.id}</td>
        <td>${tipoLabel[item.tipo_recurso]}</td>
        <td>${recursoCodigoMap.get(item.recurso_id) ?? item.recurso_id}</td>
        <td>${solicitanteNombreMap.get(item.solicitante_ci) ?? item.solicitante_ci}</td>
        <td><span class="badge badge-${item.estado}">${estadoConfig[item.estado].label}</span></td>
        <td>${formatDate(item.fecha_creacion)}</td>
      </tr>
    `
    )
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reporte de Solicitudes</title>
        ${styles}
      </head>
      <body>
        <h1>Reporte de Solicitudes de Reubicación</h1>
        <p>Generado el ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr><th>ID</th><th>Tipo</th><th>Recurso</th><th>Solicitante</th><th>Estado</th><th>Fecha creación</th></tr>
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

export default function SolicitudesPage() {
  const queryClient = useQueryClient();
  const auth = useAuth() as any;

  const currentUser = auth.currentUser ?? auth.user ?? auth.profile ?? null;

  const rawRole =
    auth.role ??
    auth.userRole ??
    currentUser?.rol?.nombre ??
    currentUser?.role ??
    currentUser?.rolNombre ??
    currentUser?.rol_nombre ??
    "";

  const roleName = String(rawRole).trim().toLowerCase();

  const currentCi =
    currentUser?.ci ??
    auth.currentUser?.ci ??
    auth.user?.ci ??
    auth.profile?.ci ??
    "";

  const [estadoFiltro, setEstadoFiltro] = useState<EstadoSolicitud | "todos">("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudMovimiento | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openTomar, setOpenTomar] = useState(false);
  const [openResolver, setOpenResolver] = useState(false);
  const [openCancelar, setOpenCancelar] = useState(false);
  const [tomarComentario, setTomarComentario] = useState("");
  const [cancelarComentario, setCancelarComentario] = useState("");

  const isDocente = roleName === "docente";
  const isTecnicoOrAdmin = roleName === "tecnico" || roleName === "admin";

  const createForm = useForm<CreateFormValues>({
    defaultValues: {
      tipo_recurso: "atrapaniebla",
      recurso_id: undefined,
      ubicacion_destino_id: undefined,
      ubicacion_destino_propuesta: "",
      motivo: "",
      pdf_url: "",
    },
  });

  const resolverForm = useForm<ResolverFormValues>({
    defaultValues: {
      aprobar: "si",
      observacion: "",
      ubicacion_destino_id: undefined,
      pdf_url: "",
    },
  });

  const tipoSeleccionado = createForm.watch("tipo_recurso");
  const aprobacionSeleccionada = resolverForm.watch("aprobar");

  const solicitudesQuery = useQuery({
    queryKey: ["solicitudes", estadoFiltro],
    queryFn: () =>
      solicitudesService.getAll({
        estado: estadoFiltro === "todos" ? undefined : estadoFiltro,
        limit: 500,
      }),
  });

  const detalleSolicitudQuery = useQuery({
    queryKey: ["solicitud-detalle", selectedSolicitud?.id],
    queryFn: () => solicitudesService.getById(selectedSolicitud!.id),
    enabled: openDetail && !!selectedSolicitud?.id,
  });

  const ubicacionesQuery = useQuery({
    queryKey: ["ubicaciones", "all-for-solicitudes"],
    queryFn: () => ubicacionesService.getAll(),
  });

  // Queries para obtener TODOS los recursos
  const todosAtrapanieblasQuery = useQuery({
    queryKey: ["atrapanieblas", "todos-para-codigos"],
    queryFn: () => atrapanieblasService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const todasFuentesAguaQuery = useQuery({
    queryKey: ["fuentes-agua", "todos-para-codigos"],
    queryFn: () => fuentesAguaService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Query para obtener todos los usuarios (solicitantes)
  const usuariosQuery = useQuery({
    queryKey: ["usuarios", "todos-para-solicitudes"],
    queryFn: () => usersService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Mapa id -> código para recursos
  const recursoCodigoMap = useMemo(() => {
    const map = new Map<number, string>();
    (todosAtrapanieblasQuery.data ?? []).forEach((item: any) => {
      if (item.id && item.codigo) map.set(item.id, item.codigo);
    });
    (todasFuentesAguaQuery.data ?? []).forEach((item: any) => {
      if (item.id && item.codigo) map.set(item.id, item.codigo);
    });
    return map;
  }, [todosAtrapanieblasQuery.data, todasFuentesAguaQuery.data]);

  // Mapa id -> nombre para ubicaciones
  const ubicacionNombreMap = useMemo(() => {
    const map = new Map<number, string>();
    (ubicacionesQuery.data ?? []).forEach((item: any) => {
      if (item.id && item.nombre) map.set(item.id, item.nombre);
    });
    return map;
  }, [ubicacionesQuery.data]);

  // Mapa ci -> nombre completo para solicitantes
  const solicitanteNombreMap = useMemo(() => {
    const map = new Map<string, string>();
    (usuariosQuery.data ?? []).forEach((item: any) => {
      if (item.ci) {
        const nombreCompleto = [item.nombres, item.apellido_paterno, item.apellido_materno]
          .filter(Boolean)
          .join(" ");
        map.set(item.ci, nombreCompleto || item.ci);
      }
    });
    return map;
  }, [usuariosQuery.data]);

  // Queries para el formulario de creación
  const atrapanieblasQuery = useQuery({
    queryKey: ["atrapanieblas", "all-for-solicitudes"],
    queryFn: () => atrapanieblasService.getAll(),
    enabled: tipoSeleccionado === "atrapaniebla",
  });

  const fuentesAguaQuery = useQuery({
    queryKey: ["fuentes-agua", "all-for-solicitudes"],
    queryFn: () => fuentesAguaService.getAll(),
    enabled: tipoSeleccionado === "fuenteagua",
  });

  const recursos = useMemo<any[]>(() => {
    if (tipoSeleccionado === "atrapaniebla") return atrapanieblasQuery.data ?? [];
    return fuentesAguaQuery.data ?? [];
  }, [tipoSeleccionado, atrapanieblasQuery.data, fuentesAguaQuery.data]);

  const ubicaciones = useMemo<any[]>(() => ubicacionesQuery.data ?? [], [ubicacionesQuery.data]);
  const solicitudes = useMemo<SolicitudMovimiento[]>(
    () => solicitudesQuery.data ?? [],
    [solicitudesQuery.data]
  );
  const selectedSolicitudDetail: SolicitudMovimientoDetail | null =
    detalleSolicitudQuery.data ?? null;

  // Filtrado en tiempo real (incluye nombre de ubicación y de solicitante)
  const filteredSolicitudes = useMemo(() => {
    const items = solicitudes;
    const term = searchTerm.toLowerCase().trim();

    if (!term) return items;

    return items.filter((item) => {
      const recursoCodigo = recursoCodigoMap.get(item.recurso_id) ?? "";
      const solicitanteNombre = solicitanteNombreMap.get(item.solicitante_ci) ?? "";
      const ubicacionOrigenNombre = ubicacionNombreMap.get(item.ubicacion_origen_id) ?? "";
      const ubicacionDestinoNombre = ubicacionNombreMap.get(item.ubicacion_destino_id ?? 0) ?? "";
      return (
        String(item.id).includes(term) ||
        tipoLabel[item.tipo_recurso].toLowerCase().includes(term) ||
        recursoCodigo.toLowerCase().includes(term) ||
        solicitanteNombre.toLowerCase().includes(term) ||
        item.solicitante_ci.toLowerCase().includes(term) ||
        ubicacionOrigenNombre.toLowerCase().includes(term) ||
        ubicacionDestinoNombre.toLowerCase().includes(term) ||
        (item.ubicacion_destino_propuesta?.toLowerCase().includes(term) ?? false) ||
        estadoConfig[item.estado].label.toLowerCase().includes(term) ||
        formatDate(item.fecha_creacion).toLowerCase().includes(term)
      );
    });
  }, [solicitudes, searchTerm, recursoCodigoMap, solicitanteNombreMap, ubicacionNombreMap]);

  const stats = useMemo(() => {
    const items = filteredSolicitudes;
    return {
      total: items.length,
      pendiente: items.filter((s) => s.estado === "pendiente").length,
      en_revision: items.filter((s) => s.estado === "en_revision").length,
      aprobada: items.filter((s) => s.estado === "aprobada").length,
      rechazada: items.filter((s) => s.estado === "rechazada").length,
      cancelada: items.filter((s) => s.estado === "cancelada").length,
    };
  }, [filteredSolicitudes]);

  const crearMutation = useMutation({
    mutationFn: (payload: CrearSolicitudPayload) => solicitudesService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["solicitudes"] });
      await queryClient.invalidateQueries({ queryKey: ["atrapanieblas"] });
      await queryClient.invalidateQueries({ queryKey: ["fuentes-agua"] });
      createForm.reset({
        tipo_recurso: "atrapaniebla",
        recurso_id: undefined,
        ubicacion_destino_id: undefined,
        ubicacion_destino_propuesta: "",
        motivo: "",
        pdf_url: "",
      });
      setOpenCreate(false);
    },
  });

  const tomarMutation = useMutation({
    mutationFn: (payload: { id: number; comentario?: string }) =>
      solicitudesService.tomar(payload.id, { comentario: payload.comentario }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["solicitudes"] });
      setSelectedSolicitud(data);
      setTomarComentario("");
      setOpenTomar(false);
      setOpenDetail(true);
    },
  });

  const resolverMutation = useMutation({
    mutationFn: (payload: { id: number; body: ResolverSolicitudPayload }) =>
      solicitudesService.resolver(payload.id, payload.body),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["solicitudes"] });
      setSelectedSolicitud(data);
      resolverForm.reset({
        aprobar: "si",
        observacion: "",
        ubicacion_destino_id: undefined,
        pdf_url: "",
      });
      setOpenResolver(false);
      setOpenDetail(true);
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: (payload: { id: number; comentario?: string }) =>
      solicitudesService.cancelar(payload.id, { comentario: payload.comentario }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["solicitudes"] });
      setSelectedSolicitud(data);
      setCancelarComentario("");
      setOpenCancelar(false);
      setOpenDetail(true);
    },
  });

  const onCreateSubmit = createForm.handleSubmit((values) => {
    crearMutation.mutate({
      tipo_recurso: values.tipo_recurso,
      recurso_id: Number(values.recurso_id),
      ubicacion_destino_id: values.ubicacion_destino_id ? Number(values.ubicacion_destino_id) : null,
      ubicacion_destino_propuesta: values.ubicacion_destino_propuesta || null,
      motivo: values.motivo,
      pdf_url: values.pdf_url || null,
    });
  });

  const onResolverSubmit = resolverForm.handleSubmit((values) => {
    if (!selectedSolicitud) return;

    resolverMutation.mutate({
      id: selectedSolicitud.id,
      body: {
        aprobar: values.aprobar === "si",
        observacion: values.observacion,
        ubicacion_destino_id:
          values.aprobar === "si" && values.ubicacion_destino_id
            ? Number(values.ubicacion_destino_id)
            : null,
        pdf_url: values.pdf_url || null,
      },
    });
  });

  const canTake = (s: SolicitudMovimiento) => isTecnicoOrAdmin && s.estado === "pendiente";
  const canResolve = (s: SolicitudMovimiento) => isTecnicoOrAdmin && s.estado === "en_revision";
  const canCancel = (s: SolicitudMovimiento) =>
    isDocente && s.estado === "pendiente" && s.solicitante_ci === currentCi;

  const handleExportCSV = () => {
    exportToCSV(
      filteredSolicitudes,
      recursoCodigoMap,
      ubicacionNombreMap,
      solicitanteNombreMap,
      `solicitudes_${new Date().toISOString().split("T")[0]}`
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      filteredSolicitudes,
      recursoCodigoMap,
      ubicacionNombreMap,
      solicitanteNombreMap,
      `solicitudes_${new Date().toISOString().split("T")[0]}`
    );
  };

  const handleExportPDF = () => {
    exportToPDF(filteredSolicitudes, recursoCodigoMap, solicitanteNombreMap);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Solicitudes de reubicación
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Gestiona el flujo de trabajo para la reubicación de atrapanieblas y fuentes de agua. 
              Los docentes crean solicitudes, el equipo técnico las revisa y aprueba, 
              manteniendo un historial completo de trazabilidad.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="rounded-xl border-border/70"
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="rounded-xl border-border/70"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="rounded-xl border-border/70"
            >
              <FileJson className="mr-2 h-4 w-4" />
              PDF
            </Button>

            {isDocente && (
              <Dialog
                open={openCreate}
                onOpenChange={(value) => {
                  setOpenCreate(value);
                  if (!value) {
                    createForm.reset({
                      tipo_recurso: "atrapaniebla",
                      recurso_id: undefined,
                      ubicacion_destino_id: undefined,
                      ubicacion_destino_propuesta: "",
                      motivo: "",
                      pdf_url: "",
                    });
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva solicitud
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 sm:max-w-2xl">
                  <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
                    <DialogTitle className="text-xl">Nueva solicitud</DialogTitle>
                    <DialogDescription>
                      Registra una solicitud formal de reubicación
                    </DialogDescription>
                  </DialogHeader>

                  <form className="space-y-6 pt-2" onSubmit={onCreateSubmit}>
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tipo de recurso</Label>
                        <Select
                          value={createForm.watch("tipo_recurso")}
                          onValueChange={(value) =>
                            createForm.setValue("tipo_recurso", value as TipoRecursoSolicitud)
                          }
                        >
                          <SelectTrigger className="h-11 rounded-xl border-border/70">
                            <SelectValue placeholder="Selecciona tipo" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/70">
                            <SelectItem value="atrapaniebla">Atrapaniebla</SelectItem>
                            <SelectItem value="fuenteagua">Fuente de agua</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Recurso</Label>
                        <Select
                          value={
                            createForm.watch("recurso_id")
                              ? String(createForm.watch("recurso_id"))
                              : undefined
                          }
                          onValueChange={(value) => createForm.setValue("recurso_id", Number(value))}
                        >
                          <SelectTrigger className="h-11 rounded-xl border-border/70">
                            <SelectValue placeholder="Selecciona recurso" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/70">
                            {recursos.map((item: any) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.codigo ?? item.nombre ?? `Recurso #${item.id}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Ubicación destino oficial</Label>
                        <Select
                          value={
                            createForm.watch("ubicacion_destino_id")
                              ? String(createForm.watch("ubicacion_destino_id"))
                              : undefined
                          }
                          onValueChange={(value) =>
                            createForm.setValue("ubicacion_destino_id", Number(value))
                          }
                        >
                          <SelectTrigger className="h-11 rounded-xl border-border/70">
                            <SelectValue placeholder="Opcional" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/70">
                            {ubicaciones.map((item: any) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.nombre ?? `Ubicación #${item.id}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Destino propuesto</Label>
                        <Input
                          placeholder="Texto libre si aún no existe"
                          className="h-11 rounded-xl border-border/70"
                          {...createForm.register("ubicacion_destino_propuesta")}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Motivo</Label>
                      <Textarea
                        placeholder="Describe por qué se solicita el cambio"
                        rows={4}
                        className="rounded-xl border-border/70"
                        {...createForm.register("motivo", { required: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">PDF URL</Label>
                      <Input
                        placeholder="https://..."
                        className="h-11 rounded-xl border-border/70"
                        {...createForm.register("pdf_url")}
                      />
                    </div>

                    {crearMutation.isError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                        {normalizeError(crearMutation.error)}
                      </div>
                    )}

                    <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpenCreate(false)}
                        className="rounded-xl border-border/70"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={crearMutation.isPending} className="rounded-xl">
                        {crearMutation.isPending ? "Guardando..." : "Crear solicitud"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid gap-3 border-t border-border/70 px-6 py-5 md:grid-cols-6">
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
            <p className="text-xs uppercase tracking-wider text-emerald-700">Aprobadas</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">{stats.aprobada}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-rose-700">Rechazadas</p>
            <p className="mt-1 text-2xl font-semibold text-rose-700">{stats.rechazada}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-zinc-600">Canceladas</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-600">{stats.cancelada}</p>
          </div>
        </div>
      </section>

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
                variant={estadoFiltro === "aprobada" ? "default" : "outline"}
                onClick={() => setEstadoFiltro("aprobada")}
                className="rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aprobadas
              </Button>
              <Button
                variant={estadoFiltro === "rechazada" ? "default" : "outline"}
                onClick={() => setEstadoFiltro("rechazada")}
                className="rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazadas
              </Button>
              <Button
                variant={estadoFiltro === "cancelada" ? "default" : "outline"}
                onClick={() => setEstadoFiltro("cancelada")}
                className="rounded-lg border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-700"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Canceladas
              </Button>
            </div>

            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Buscar por ID, tipo, recurso, solicitante, ubicación o estado..."
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
                <TableHead className="h-12">Tipo</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha creación</TableHead>
                <TableHead className="text-right w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitudesQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    Cargando solicitudes...
                  </TableCell>
                </TableRow>
              ) : filteredSolicitudes.length ? (
                filteredSolicitudes.map((solicitud) => {
                  const Icon = estadoConfig[solicitud.estado].icon;
                  return (
                    <TableRow key={solicitud.id} className="transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {tipoLabel[solicitud.tipo_recurso]}
                      </TableCell>
                      <TableCell>
                        {recursoCodigoMap.get(solicitud.recurso_id) ?? solicitud.recurso_id}
                      </TableCell>
                      <TableCell>
                        {solicitanteNombreMap.get(solicitud.solicitante_ci) ?? solicitud.solicitante_ci}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${estadoConfig[solicitud.estado].bgColor} ${estadoConfig[solicitud.estado].color}`}
                        >
                          <Icon className="h-3 w-3" />
                          {estadoConfig[solicitud.estado].label}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(solicitud.fecha_creacion)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSolicitud(solicitud);
                              setOpenDetail(true);
                            }}
                            className="rounded-lg"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {canTake(solicitud) && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSolicitud(solicitud);
                                setOpenTomar(true);
                              }}
                              className="rounded-lg"
                            >
                              Tomar
                            </Button>
                          )}

                          {canResolve(solicitud) && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedSolicitud(solicitud);
                                setOpenResolver(true);
                              }}
                              className="rounded-lg"
                            >
                              Resolver
                            </Button>
                          )}

                          {canCancel(solicitud) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedSolicitud(solicitud);
                                setOpenCancelar(true);
                              }}
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
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ClipboardList className="h-6 w-6" />
                      <p className="text-sm font-medium text-foreground">
                        {searchTerm ? "No hay coincidencias para tu búsqueda" : "No hay solicitudes registradas"}
                      </p>
                      {isDocente && !searchTerm && (
                        <p className="text-sm">Crea tu primera solicitud usando el botón superior</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {solicitudesQuery.isError && (
          <div className="border-t border-border/70 px-5 py-4">
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {normalizeError(solicitudesQuery.error)}
            </div>
          </div>
        )}
      </section>

      {/* Diálogo de detalle */}
      <Dialog
        open={openDetail}
        onOpenChange={(value) => {
          setOpenDetail(value);
          if (!value) setSelectedSolicitud(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 sm:max-w-3xl">
          <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
            <DialogTitle className="text-xl">Solicitud #{selectedSolicitud?.id ?? "—"}</DialogTitle>
            <DialogDescription>Detalle completo e historial de la solicitud</DialogDescription>
          </DialogHeader>

          {detalleSolicitudQuery.isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando detalle...</div>
          ) : selectedSolicitudDetail ? (
            <div className="space-y-6 pt-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Estado</p>
                  <div className="mt-2">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${estadoConfig[selectedSolicitudDetail.estado].bgColor} ${estadoConfig[selectedSolicitudDetail.estado].color}`}
                    >
                      {(() => {
                        const Icon = estadoConfig[selectedSolicitudDetail.estado].icon;
                        return <Icon className="h-3 w-3" />;
                      })()}
                      {estadoConfig[selectedSolicitudDetail.estado].label}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Tipo</p>
                  <p className="mt-2 text-sm font-medium">
                    {tipoLabel[selectedSolicitudDetail.tipo_recurso]}
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Código recurso</p>
                  <p className="mt-2 text-sm font-medium">
                    {recursoCodigoMap.get(selectedSolicitudDetail.recurso_id) ?? selectedSolicitudDetail.recurso_id}
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Solicitante</p>
                  <p className="mt-2 text-sm font-medium">
                    {solicitanteNombreMap.get(selectedSolicitudDetail.solicitante_ci) ?? selectedSolicitudDetail.solicitante_ci}
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Revisor</p>
                  <p className="mt-2 text-sm font-medium">
                    {selectedSolicitudDetail.revisor_ci ? (solicitanteNombreMap.get(selectedSolicitudDetail.revisor_ci) ?? selectedSolicitudDetail.revisor_ci) : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Ubicación origen</p>
                  <p className="mt-2 text-sm font-medium">
                    {ubicacionNombreMap.get(selectedSolicitudDetail.ubicacion_origen_id) ?? selectedSolicitudDetail.ubicacion_origen_id}
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Ubicación destino</p>
                  <p className="mt-2 text-sm font-medium">
                    {selectedSolicitudDetail.ubicacion_destino_id
                      ? (ubicacionNombreMap.get(selectedSolicitudDetail.ubicacion_destino_id) ?? selectedSolicitudDetail.ubicacion_destino_id)
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Destino propuesto</p>
                  <p className="mt-2 text-sm font-medium">
                    {selectedSolicitudDetail.ubicacion_destino_propuesta || "—"}
                  </p>
                </div>
              </div>

              <Separator className="border-border/70" />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Motivo</h3>
                </div>
                <p className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm">
                  {selectedSolicitudDetail.motivo}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Observación</h3>
                </div>
                <p className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm">
                  {selectedSolicitudDetail.observacion || "—"}
                </p>
              </div>

              {selectedSolicitudDetail.pdf_url && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Documento adjunto</h3>
                  </div>
                  <a
                    href={selectedSolicitudDetail.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-border/70 px-4 py-2 text-sm text-primary hover:bg-muted/30"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver documento
                  </a>
                </div>
              )}

              <Separator className="border-border/70" />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Historial de cambios</h3>
                </div>

                {selectedSolicitudDetail.historial.length ? (
                  <div className="space-y-3">
                    {selectedSolicitudDetail.historial.map((item, index) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border border-border/70 p-4 ${index !== selectedSolicitudDetail.historial.length - 1 ? "border-b" : ""}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${estadoConfig[item.estado_nuevo].bgColor} ${estadoConfig[item.estado_nuevo].color}`}
                          >
                            {(() => {
                              const Icon = estadoConfig[item.estado_nuevo].icon;
                              return <Icon className="h-3 w-3" />;
                            })()}
                            {estadoConfig[item.estado_nuevo].label}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.creado_en)}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <div className="h-4 w-4" />
                          <span>
                            <span className="font-medium">Actor:</span> {item.actor_ci ? (solicitanteNombreMap.get(item.actor_ci) ?? item.actor_ci) : "—"}
                          </span>
                        </div>

                        {item.comentario && (
                          <div className="mt-2 flex items-start gap-2 text-sm">
                            <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{item.comentario}</span>
                          </div>
                        )}

                        {item.pdf_url && (
                          <a
                            href={item.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver documento adjunto
                          </a>
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
            </div>
          ) : (
            <div className="py-8 text-center text-rose-600">
              {normalizeError(detalleSolicitudQuery.error)}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogos de tomar, resolver y cancelar (sin cambios funcionales) */}
      <Dialog open={openTomar} onOpenChange={setOpenTomar}>
        <DialogContent className="border-border/70 sm:max-w-md">
          <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
            <DialogTitle className="text-xl">Tomar solicitud</DialogTitle>
            <DialogDescription>La solicitud pasará a estado "En revisión"</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Comentario (opcional)</Label>
              <Textarea
                rows={4}
                value={tomarComentario}
                onChange={(e) => setTomarComentario(e.target.value)}
                placeholder="Agrega un comentario sobre la toma de la solicitud"
                className="rounded-xl border-border/70"
              />
            </div>
            {tomarMutation.isError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {normalizeError(tomarMutation.error)}
              </div>
            )}
            <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
              <Button variant="outline" onClick={() => setOpenTomar(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                onClick={() =>
                  selectedSolicitud &&
                  tomarMutation.mutate({
                    id: selectedSolicitud.id,
                    comentario: tomarComentario || undefined,
                  })
                }
                disabled={tomarMutation.isPending}
                className="rounded-xl"
              >
                {tomarMutation.isPending ? "Procesando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openResolver} onOpenChange={setOpenResolver}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 sm:max-w-2xl">
          <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
            <DialogTitle className="text-xl">Resolver solicitud</DialogTitle>
            <DialogDescription>Aprueba o rechaza la solicitud con observación obligatoria</DialogDescription>
          </DialogHeader>
          <form className="space-y-6 pt-2" onSubmit={onResolverSubmit}>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Decisión</Label>
              <Select
                value={resolverForm.watch("aprobar")}
                onValueChange={(value) => resolverForm.setValue("aprobar", value as "si" | "no")}
              >
                <SelectTrigger className="h-11 rounded-xl border-border/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/70">
                  <SelectItem value="si">Aprobar</SelectItem>
                  <SelectItem value="no">Rechazar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {aprobacionSeleccionada === "si" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ubicación destino final</Label>
                <Select
                  value={
                    resolverForm.watch("ubicacion_destino_id")
                      ? String(resolverForm.watch("ubicacion_destino_id"))
                      : undefined
                  }
                  onValueChange={(value) =>
                    resolverForm.setValue("ubicacion_destino_id", Number(value))
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl border-border/70">
                    <SelectValue placeholder="Selecciona ubicación" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/70">
                    {ubicaciones.map((item: any) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.nombre ?? `Ubicación #${item.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Observación</Label>
              <Textarea
                rows={4}
                placeholder="Observación obligatoria"
                className="rounded-xl border-border/70"
                {...resolverForm.register("observacion", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">PDF URL</Label>
              <Input
                placeholder="https://..."
                className="h-11 rounded-xl border-border/70"
                {...resolverForm.register("pdf_url")}
              />
            </div>

            {resolverMutation.isError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {normalizeError(resolverMutation.error)}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenResolver(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={resolverMutation.isPending} className="rounded-xl">
                {resolverMutation.isPending ? "Guardando..." : "Resolver"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openCancelar} onOpenChange={setOpenCancelar}>
        <DialogContent className="border-border/70 sm:max-w-md">
          <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
            <DialogTitle className="text-xl">Cancelar solicitud</DialogTitle>
            <DialogDescription>Solo puedes cancelar solicitudes pendientes creadas por ti</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Comentario (opcional)</Label>
              <Textarea
                rows={4}
                value={cancelarComentario}
                onChange={(e) => setCancelarComentario(e.target.value)}
                placeholder="Explica el motivo de la cancelación"
                className="rounded-xl border-border/70"
              />
            </div>
            {cancelarMutation.isError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {normalizeError(cancelarMutation.error)}
              </div>
            )}
            <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
              <Button variant="outline" onClick={() => setOpenCancelar(false)} className="rounded-xl">
                Volver
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  selectedSolicitud &&
                  cancelarMutation.mutate({
                    id: selectedSolicitud.id,
                    comentario: cancelarComentario || undefined,
                  })
                }
                disabled={cancelarMutation.isPending}
                className="rounded-xl"
              >
                {cancelarMutation.isPending ? "Procesando..." : "Cancelar solicitud"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}