import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Cpu,
  Activity,
  Wifi,
  Search,
  Download,
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import Papa from 'papaparse'

import { dispositivosService } from '@/services/dispositivos.service'
import { catalogosService } from '@/services/catalogos.service'
import type {
  DispositivoCreatePayload,
  DispositivoResponse,
  DispositivoUpdatePayload,
} from '@/types/dispositivo'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type FormState = {
  tipo_dispositivo_id: string
  codigo: string
  nombre: string
  identificador_local: string
  ip_local: string
  version_firmware: string
  estado_dispositivo_id: string
}

const initialForm: FormState = {
  tipo_dispositivo_id: '',
  codigo: '',
  nombre: '',
  identificador_local: '',
  ip_local: '',
  version_firmware: '',
  estado_dispositivo_id: '',
}

type MetricTone = 'emerald' | 'teal' | 'amber' | 'rose' | 'blue' | 'violet'

type StatCard = {
  title: string
  value: string
  helper: string
  icon: React.ElementType
  tone: MetricTone
}

const toneMap = {
  emerald:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300',
  teal:
    'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/40 dark:bg-teal-950/20 dark:text-teal-300',
  amber:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300',
  rose:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300',
  blue:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300',
  violet:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-300',
}

function MetricCard({ item }: { item: StatCard }) {
  const Icon = item.icon

  return (
    <Card className="h-full rounded-[24px] border border-border/70 bg-card shadow-none transition-all hover:border-primary/30 hover:bg-accent/30">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-2">
          <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {item.title}
          </CardDescription>
          <CardTitle className="text-4xl font-bold tracking-tight text-foreground">
            {item.value}
          </CardTitle>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${toneMap[item.tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm leading-6 text-muted-foreground">{item.helper}</p>
      </CardContent>
    </Card>
  )
}

function SurfaceCard({
  title,
  description,
  children,
  action,
  className = '',
}: {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`rounded-[24px] border border-border/70 bg-card shadow-none ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1 text-sm leading-6">{description}</CardDescription>
            )}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function getEstadoBadgeClass(nombre?: string | null) {
  const value = String(nombre ?? '').trim().toLowerCase()

  if (value.includes('inactivo') || value.includes('error') || value.includes('fall')) {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300'
  }

  if (value.includes('mantenimiento') || value.includes('revision') || value.includes('revisión')) {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300'
  }

  if (value.includes('activo') || value.includes('operativo')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
  }

  return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300'
}

function getTipoBadgeClass(nombre?: string | null) {
  const value = String(nombre ?? '').trim().toLowerCase()

  if (value.includes('controlador') || value.includes('plc')) {
    return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-300'
  }

  if (value.includes('sensor') || value.includes('medición')) {
    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300'
  }

  if (value.includes('actuador') || value.includes('válvula')) {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300'
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
}

function downloadBlob(content: BlobPart, fileName: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export default function DispositivosPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DispositivoResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Filtros en tiempo real
  const [filtroTipo, setFiltroTipo] = useState<string>('all')
  const [filtroEstado, setFiltroEstado] = useState<string>('all')

  const dispositivosQuery = useQuery({
    queryKey: ['dispositivos'],
    queryFn: dispositivosService.getAll,
  })

  const tiposDispositivoQuery = useQuery({
    queryKey: ['catalogos', 'tipos-dispositivo'],
    queryFn: catalogosService.getTiposDispositivo,
  })

  const estadosDispositivoQuery = useQuery({
    queryKey: ['catalogos', 'estados-dispositivo'],
    queryFn: catalogosService.getEstadosDispositivo,
  })

  const createMutation = useMutation({
    mutationFn: (payload: DispositivoCreatePayload) => dispositivosService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dispositivos'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DispositivoUpdatePayload }) =>
      dispositivosService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dispositivos'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => dispositivosService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dispositivos'] })
    },
    onError: handleMutationError,
  })

  function handleMutationError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail
      setApiError(typeof detail === 'string' ? detail : 'Ocurrió un error en la operación.')
    } else {
      setApiError('Ocurrió un error inesperado.')
    }
  }

  function resetFormAndClose() {
    setForm(initialForm)
    setEditingItem(null)
    setApiError(null)
    setOpen(false)
  }

  function openCreateModal() {
    setEditingItem(null)
    setForm(initialForm)
    setApiError(null)
    setOpen(true)
  }

  function openEditModal(item: DispositivoResponse) {
    setEditingItem(item)
    setForm({
      tipo_dispositivo_id: String(item.tipo_dispositivo_id),
      codigo: item.codigo,
      nombre: item.nombre,
      identificador_local: item.identificador_local ?? '',
      ip_local: item.ip_local ?? '',
      version_firmware: item.version_firmware ?? '',
      estado_dispositivo_id: String(item.estado_dispositivo_id),
    })
    setApiError(null)
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    if (
      !form.tipo_dispositivo_id ||
      !form.codigo.trim() ||
      !form.nombre.trim() ||
      !form.estado_dispositivo_id
    ) {
      setApiError('Completa todos los campos obligatorios.')
      return
    }

    const payloadBase: DispositivoCreatePayload = {
      tipo_dispositivo_id: Number(form.tipo_dispositivo_id),
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      identificador_local: form.identificador_local.trim() || null,
      ip_local: form.ip_local.trim() || null,
      version_firmware: form.version_firmware.trim() || null,
      estado_dispositivo_id: Number(form.estado_dispositivo_id),
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload: payloadBase })
    } else {
      createMutation.mutate(payloadBase)
    }
  }

  const dispositivosData = dispositivosQuery.data ?? []
  const tiposData = tiposDispositivoQuery.data ?? []
  const estadosData = estadosDispositivoQuery.data ?? []

  // Aplicar filtros en tiempo real (búsqueda + tipo + estado)
  const filteredItems = useMemo(() => {
    let items = dispositivosData

    // Búsqueda por texto
    const term = search.toLowerCase().trim()
    if (term) {
      items = items.filter(
        (item) =>
          String(item.id).includes(term) ||
          item.codigo.toLowerCase().includes(term) ||
          item.nombre.toLowerCase().includes(term) ||
          (item.ip_local && item.ip_local.includes(term))
      )
    }

    // Filtro por tipo de dispositivo
    if (filtroTipo !== 'all') {
      items = items.filter((item) => String(item.tipo_dispositivo_id) === filtroTipo)
    }

    // Filtro por estado
    if (filtroEstado !== 'all') {
      items = items.filter((item) => String(item.estado_dispositivo_id) === filtroEstado)
    }

    return items
  }, [dispositivosData, search, filtroTipo, filtroEstado])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const totalDispositivos = dispositivosData.length
  const conectados = dispositivosData.filter((item) =>
    String(item.estado_dispositivo_nombre ?? '').trim().toLowerCase() === 'activo'
  ).length
  const conIp = dispositivosData.filter((item) => Boolean(item.ip_local?.trim())).length

  // Preparar datos para exportación (solo los filtrados)
  const exportRows = useMemo(() => {
    return filteredItems.map((item) => {
      const tipo = tiposData.find((t) => t.id === item.tipo_dispositivo_id)
      const estado = estadosData.find((e) => e.id === item.estado_dispositivo_id)

      return {
        Código: item.codigo,
        Nombre: item.nombre,
        Tipo: tipo?.nombre ?? `ID: ${item.tipo_dispositivo_id}`,
        Estado: estado?.nombre ?? `ID: ${item.estado_dispositivo_id}`,
        'Identificador Local': item.identificador_local || '—',
        'IP Local': item.ip_local || '—',
        'Versión Firmware': item.version_firmware || '—',
      }
    })
  }, [filteredItems, tiposData, estadosData])

  // Funciones de exportación
  async function handleExportCSV() {
    try {
      setIsExporting(true)
      const csv = Papa.unparse(exportRows)
      downloadBlob(csv, `dispositivos-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`, 'text/csv;charset=utf-8;')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportExcel() {
    try {
      setIsExporting(true)
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Dispositivos')

      worksheet.columns = Object.keys(exportRows[0] || {}).map((key) => ({
        header: key,
        key,
        width: Math.max(16, key.length + 4),
      }))

      exportRows.forEach((row) => worksheet.addRow(row))

      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '10B981' },
      }
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

      worksheet.eachRow((row, rowNumber) => {
        row.alignment = { vertical: 'middle' }
        if (rowNumber > 1) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'E5E7EB' } },
              left: { style: 'thin', color: { argb: 'E5E7EB' } },
              bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
              right: { style: 'thin', color: { argb: 'E5E7EB' } },
            }
          })
        }
      })

      const buffer = await workbook.xlsx.writeBuffer()
      downloadBlob(buffer, `dispositivos-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportPDF() {
    try {
      setIsExporting(true)
      const doc = new jsPDF('landscape', 'pt', 'a4')
      doc.setFontSize(16)
      doc.text('Listado de Dispositivos', 40, 30)
      doc.setFontSize(10)
      doc.text(`Generado: ${new Date().toLocaleString()}`, 40, 50)

      const headers = Object.keys(exportRows[0] || {})
      const body = exportRows.map((row) => Object.values(row).map((v) => String(v)))

      autoTable(doc, {
        startY: 70,
        head: [headers],
        body,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 40, right: 40 },
      })

      doc.save(`dispositivos-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  const stats: StatCard[] = [
    {
      title: 'Dispositivos',
      value: String(totalDispositivos),
      helper: 'Equipos registrados en el sistema',
      icon: Cpu,
      tone: 'emerald',
    },
    {
      title: 'Activos',
      value: String(conectados),
      helper: 'Dispositivos con estado operativo',
      icon: Activity,
      tone: 'teal',
    },
    {
      title: 'Con IP local',
      value: String(conIp),
      helper: 'Equipos identificables en red local',
      icon: Wifi,
      tone: 'blue',
    },
  ]

  return (
    <div className="min-h-full space-y-6 bg-background">
      <section className="rounded-[28px] border border-border/70 bg-card px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
            >
              IoT y monitoreo
            </Badge>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Dispositivos
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              Gestiona los dispositivos y controladores del sistema.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['dispositivos'] })
                queryClient.invalidateQueries({ queryKey: ['catalogos'] })
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar
            </Button>

            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={handleExportCSV}
              disabled={isExporting || filteredItems.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>

            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={handleExportExcel}
              disabled={isExporting || filteredItems.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>

            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={handleExportPDF}
              disabled={isExporting || filteredItems.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>

            <Dialog
              open={open}
              onOpenChange={(value) => {
                setOpen(value)
                if (!value) resetFormAndClose()
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={openCreateModal}
                  className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo dispositivo
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-2xl rounded-[28px] border border-border/70 bg-card">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-foreground">
                    {editingItem ? 'Editar dispositivo' : 'Crear dispositivo'}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-6">
                    Completa los datos de configuración del dispositivo.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código *</Label>
                      <Input
                        id="codigo"
                        value={form.codigo}
                        onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
                        placeholder="DISP-001"
                        maxLength={50}
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={form.nombre}
                        onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                        placeholder="Controlador Principal"
                        maxLength={100}
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo_dispositivo_id">Tipo de Dispositivo *</Label>
                      <Select
                        value={form.tipo_dispositivo_id}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, tipo_dispositivo_id: value }))
                        }
                        disabled={tiposDispositivoQuery.isLoading || tiposDispositivoQuery.isError}
                      >
                        <SelectTrigger className="rounded-2xl border-border/70 bg-background">
                          <SelectValue
                            placeholder={
                              tiposDispositivoQuery.isLoading ? 'Cargando...' : 'Selecciona un tipo'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposData.map((tipo) => (
                            <SelectItem key={tipo.id} value={String(tipo.id)}>
                              {tipo.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estado_dispositivo_id">Estado del Dispositivo *</Label>
                      <Select
                        value={form.estado_dispositivo_id}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, estado_dispositivo_id: value }))
                        }
                        disabled={
                          estadosDispositivoQuery.isLoading || estadosDispositivoQuery.isError
                        }
                      >
                        <SelectTrigger className="rounded-2xl border-border/70 bg-background">
                          <SelectValue
                            placeholder={
                              estadosDispositivoQuery.isLoading
                                ? 'Cargando...'
                                : 'Selecciona un estado'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {estadosData.map((estado) => (
                            <SelectItem key={estado.id} value={String(estado.id)}>
                              {estado.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="identificador_local">Identificador Local</Label>
                      <Input
                        id="identificador_local"
                        value={form.identificador_local}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, identificador_local: e.target.value }))
                        }
                        placeholder="ej. ESP32-A1"
                        maxLength={100}
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ip_local">IP Local</Label>
                      <Input
                        id="ip_local"
                        value={form.ip_local}
                        onChange={(e) => setForm((prev) => ({ ...prev, ip_local: e.target.value }))}
                        placeholder="192.168.1.100"
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="version_firmware">Versión Firmware</Label>
                      <Input
                        id="version_firmware"
                        value={form.version_firmware}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, version_firmware: e.target.value }))
                        }
                        placeholder="v1.2.0"
                        maxLength={50}
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>
                  </div>

                  {apiError && (
                    <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400">
                      {apiError}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetFormAndClose}
                      className="rounded-2xl"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {isSubmitting ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <MetricCard key={item.title} item={item} />
        ))}
      </section>

      <SurfaceCard
        title="Listado de dispositivos"
        description="Filtra por código, nombre, IP, tipo o estado en tiempo real."
        action={
          <div className="flex flex-col gap-3 w-full md:flex-row md:items-center">
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, nombre o IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-2xl border-border/70 bg-background pl-9"
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="h-11 rounded-2xl border-border/70 bg-background w-full md:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {tiposData.map((tipo) => (
                  <SelectItem key={tipo.id} value={String(tipo.id)}>
                    {tipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="h-11 rounded-2xl border-border/70 bg-background w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {estadosData.map((estado) => (
                  <SelectItem key={estado.id} value={String(estado.id)}>
                    {estado.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredItems.length} resultado{filteredItems.length === 1 ? '' : 's'}
            </div>
          </div>
        }
      >
        <div className="overflow-hidden rounded-[22px] border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/70 bg-muted/40">
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Código
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Nombre
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Tipo
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Estado
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  IP Local
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Firmware
                </TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {dispositivosQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Cargando dispositivos...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No se encontraron dispositivos con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const tipo = tiposData.find((t) => t.id === item.tipo_dispositivo_id)
                  const estado = estadosData.find((e) => e.id === item.estado_dispositivo_id)
                  const estadoNombre = estado?.nombre ?? `ID: ${item.estado_dispositivo_id}`
                  const tipoNombre = tipo?.nombre ?? `ID: ${item.tipo_dispositivo_id}`

                  return (
                    <TableRow
                      key={item.id}
                      className="border-b border-border/70 transition-colors hover:bg-accent/30"
                    >
                      <TableCell className="font-medium text-foreground">{item.codigo}</TableCell>
                      <TableCell className="text-foreground">{item.nombre}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`rounded-full border ${getTipoBadgeClass(tipoNombre)}`}
                        >
                          {tipoNombre}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`rounded-full border ${getEstadoBadgeClass(estadoNombre)}`}
                        >
                          {estadoNombre}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.ip_local || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.version_firmware || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-2xl"
                            onClick={() => openEditModal(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="destructive"
                            size="icon"
                            className="rounded-2xl"
                            onClick={() => {
                              if (window.confirm(`¿Eliminar el dispositivo ${item.codigo}?`)) {
                                deleteMutation.mutate(item.id)
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </SurfaceCard>
    </div>
  )
}