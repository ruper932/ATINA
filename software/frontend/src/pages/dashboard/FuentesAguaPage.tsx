import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Waves,
  MapPin,
  Droplets,
  CircleGauge,
  Download,
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import Papa from 'papaparse'

import { fuentesAguaService } from '@/services/fuentesAgua.service'
import type {
  EstadoFuenteAguaResponse,
  FuenteAguaCreatePayload,
  FuenteAguaResponse,
  FuenteAguaUpdatePayload,
  TipoFuenteAguaResponse,
  UbicacionResponse,
} from '@/types/fuente-agua'

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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type FormState = {
  ubicacion_id: string
  tipo_fuente_agua_id: string
  codigo: string
  nombre: string
  descripcion: string
  capacidad_l: string
  estado_fuente_agua_id: string
}

const initialForm: FormState = {
  ubicacion_id: 'none',
  tipo_fuente_agua_id: '',
  codigo: '',
  nombre: '',
  descripcion: '',
  capacidad_l: '',
  estado_fuente_agua_id: '',
}

type MetricTone = 'emerald' | 'teal' | 'amber' | 'rose' | 'blue' | 'violet' | 'sky'

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
  sky:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300',
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

function formatCapacity(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toLocaleString()} L`
}

function getEstadoClasses(nombre?: string) {
  const label = nombre?.toLowerCase() ?? ''

  if (
    label.includes('activo') ||
    label.includes('disponible') ||
    label.includes('operativo')
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300'
  }

  if (
    label.includes('mantenimiento') ||
    label.includes('pendiente') ||
    label.includes('revisión')
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300'
  }

  if (
    label.includes('inactivo') ||
    label.includes('dañado') ||
    label.includes('fuera')
  ) {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300'
  }

  return 'border-border/70 bg-muted/40 text-muted-foreground'
}

function getTipoClasses(nombre?: string) {
  const label = nombre?.toLowerCase() ?? ''

  if (label.includes('tanque') || label.includes('reservorio')) {
    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300'
  }

  if (label.includes('pozo') || label.includes('subterránea')) {
    return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-300'
  }

  if (label.includes('lluvia') || label.includes('captación')) {
    return 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-300'
  }

  return 'border-border/70 bg-muted/40 text-muted-foreground'
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

export default function FuentesAguaPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingFuente, setEditingFuente] = useState<FuenteAguaResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Filtros en tiempo real
  const [filtroTipo, setFiltroTipo] = useState<string>('all')
  const [filtroEstado, setFiltroEstado] = useState<string>('all')
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('all')

  const fuentesQuery = useQuery({
    queryKey: ['fuentes-agua'],
    queryFn: fuentesAguaService.getAll,
  })

  const tiposQuery = useQuery({
    queryKey: ['tipos-fuente-agua'],
    queryFn: fuentesAguaService.getTipos,
  })

  const estadosQuery = useQuery({
    queryKey: ['estados-fuente-agua'],
    queryFn: fuentesAguaService.getEstados,
  })

  const ubicacionesQuery = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: fuentesAguaService.getUbicaciones,
  })

  const createMutation = useMutation({
    mutationFn: (payload: FuenteAguaCreatePayload) =>
      fuentesAguaService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['fuentes-agua'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FuenteAguaUpdatePayload }) =>
      fuentesAguaService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['fuentes-agua'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fuentesAguaService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['fuentes-agua'] })
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
    setEditingFuente(null)
    setApiError(null)
    setOpen(false)
  }

  function openCreateModal() {
    setEditingFuente(null)
    setForm(initialForm)
    setApiError(null)
    setOpen(true)
  }

  function openEditModal(fuente: FuenteAguaResponse) {
    setEditingFuente(fuente)
    setForm({
      ubicacion_id: fuente.ubicacion_id != null ? String(fuente.ubicacion_id) : 'none',
      tipo_fuente_agua_id: String(fuente.tipo_fuente_agua_id),
      codigo: fuente.codigo,
      nombre: fuente.nombre,
      descripcion: fuente.descripcion ?? '',
      capacidad_l: fuente.capacidad_l != null ? String(fuente.capacidad_l) : '',
      estado_fuente_agua_id: String(fuente.estado_fuente_agua_id),
    })
    setApiError(null)
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    if (
      !form.codigo.trim() ||
      !form.nombre.trim() ||
      !form.tipo_fuente_agua_id ||
      !form.estado_fuente_agua_id
    ) {
      setApiError('Completa todos los campos obligatorios.')
      return
    }

    const payload: FuenteAguaCreatePayload = {
      ubicacion_id:
        form.ubicacion_id && form.ubicacion_id !== 'none'
          ? Number(form.ubicacion_id)
          : null,
      tipo_fuente_agua_id: Number(form.tipo_fuente_agua_id),
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      capacidad_l: form.capacidad_l ? Number(form.capacidad_l) : null,
      estado_fuente_agua_id: Number(form.estado_fuente_agua_id),
    }

    if (editingFuente) {
      updateMutation.mutate({ id: editingFuente.id, payload })
      return
    }

    createMutation.mutate(payload)
  }

  const fuentesData = fuentesQuery.data ?? []
  const tiposData = tiposQuery.data ?? []
  const estadosData = estadosQuery.data ?? []
  const ubicacionesData = ubicacionesQuery.data ?? []

  // Aplicar filtros en tiempo real (búsqueda + tipo + estado + ubicación)
  const filteredFuentes = useMemo(() => {
    let items = fuentesData

    // Búsqueda por texto
    const term = search.toLowerCase().trim()
    if (term) {
      items = items.filter(
        (fuente) =>
          fuente.codigo.toLowerCase().includes(term) ||
          fuente.nombre.toLowerCase().includes(term) ||
          String(fuente.id).includes(term)
      )
    }

    // Filtro por tipo
    if (filtroTipo !== 'all') {
      items = items.filter((fuente) => String(fuente.tipo_fuente_agua_id) === filtroTipo)
    }

    // Filtro por estado
    if (filtroEstado !== 'all') {
      items = items.filter((fuente) => String(fuente.estado_fuente_agua_id) === filtroEstado)
    }

    // Filtro por ubicación
    if (filtroUbicacion !== 'all') {
      items = items.filter((fuente) => 
        fuente.ubicacion_id != null && String(fuente.ubicacion_id) === filtroUbicacion
      )
    }

    return items
  }, [fuentesData, search, filtroTipo, filtroEstado, filtroUbicacion])

  const tiposMap = useMemo(() => {
    const map = new Map<number, string>()
    tiposData.forEach((tipo: TipoFuenteAguaResponse) => {
      map.set(tipo.id, tipo.nombre)
    })
    return map
  }, [tiposData])

  const estadosMap = useMemo(() => {
    const map = new Map<number, string>()
    estadosData.forEach((estado: EstadoFuenteAguaResponse) => {
      map.set(estado.id, estado.nombre)
    })
    return map
  }, [estadosData])

  const ubicacionesMap = useMemo(() => {
    const map = new Map<number, string>()
    ubicacionesData.forEach((ubicacion: UbicacionResponse) => {
      map.set(ubicacion.id, ubicacion.nombre)
    })
    return map
  }, [ubicacionesData])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // Métricas (sobre datos filtrados)
  const totalFuentes = filteredFuentes.length
  const capacidadTotal = filteredFuentes.reduce(
    (acc, item) => acc + Number(item.capacidad_l ?? 0),
    0
  )
  const fuentesActivas = filteredFuentes.filter((item) => {
    const estadoNombre = estadosMap.get(item.estado_fuente_agua_id) ?? ''
    const normalized = estadoNombre.trim().toLowerCase()
    return normalized.includes('activo') || normalized.includes('disponible') || normalized.includes('operativo')
  }).length

  const stats: StatCard[] = [
    {
      title: 'Fuentes',
      value: String(totalFuentes),
      helper: 'Registros de infraestructura hídrica',
      icon: Droplets,
      tone: 'sky',
    },
    {
      title: 'Activas',
      value: String(fuentesActivas),
      helper: 'Fuentes en estado operativo',
      icon: CircleGauge,
      tone: 'emerald',
    },
    {
      title: 'Capacidad total',
      value: `${capacidadTotal.toLocaleString()} L`,
      helper: 'Volumen acumulado registrado',
      icon: Waves,
      tone: 'blue',
    },
  ]

  // Preparar datos para exportación (solo los filtrados)
  const exportRows = useMemo(() => {
    return filteredFuentes.map((fuente) => {
      const tipoNombre = tiposMap.get(fuente.tipo_fuente_agua_id) ?? `Tipo #${fuente.tipo_fuente_agua_id}`
      const estadoNombre = estadosMap.get(fuente.estado_fuente_agua_id) ?? `Estado #${fuente.estado_fuente_agua_id}`
      const ubicacionNombre = fuente.ubicacion_id != null
        ? ubicacionesMap.get(fuente.ubicacion_id) ?? `Ubicación #${fuente.ubicacion_id}`
        : 'Sin ubicación'

      return {
        ID: fuente.id,
        Código: fuente.codigo,
        Nombre: fuente.nombre,
        Ubicación: ubicacionNombre,
        Tipo: tipoNombre,
        'Capacidad (L)': fuente.capacidad_l ? fuente.capacidad_l.toLocaleString() : '—',
        Estado: estadoNombre,
        Descripción: fuente.descripcion || '—',
        Creado: new Date(fuente.creado_en).toLocaleString(),
      }
    })
  }, [filteredFuentes, tiposMap, estadosMap, ubicacionesMap])

  // Funciones de exportación
  async function handleExportCSV() {
    try {
      setIsExporting(true)
      const csv = Papa.unparse(exportRows)
      downloadBlob(csv, `fuentes-agua-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`, 'text/csv;charset=utf-8;')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportExcel() {
    try {
      setIsExporting(true)
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('FuentesAgua')

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
        fgColor: { argb: '0284C7' }, // sky-600
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
      downloadBlob(buffer, `fuentes-agua-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportPDF() {
    try {
      setIsExporting(true)
      const doc = new jsPDF('landscape', 'pt', 'a4')
      doc.setFontSize(16)
      doc.text('Listado de Fuentes de Agua', 40, 30)
      doc.setFontSize(10)
      doc.text(`Generado: ${new Date().toLocaleString()}`, 40, 50)

      const headers = Object.keys(exportRows[0] || {})
      const body = exportRows.map((row) => Object.values(row).map((v) => String(v)))

      autoTable(doc, {
        startY: 70,
        head: [headers],
        body,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [2, 132, 199] }, // sky-600
        margin: { left: 40, right: 40 },
      })

      doc.save(`fuentes-agua-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-sky-50 via-background to-cyan-50 shadow-sm dark:from-sky-950/20 dark:via-background dark:to-cyan-950/10">
        <div className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300">
              <Droplets className="h-3.5 w-3.5" />
              Infraestructura hídrica
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Fuentes de Agua
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
              Gestiona depósitos, reservorios y otras fuentes registradas en el
              sistema para una mejor trazabilidad operativa.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Registros visibles
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {totalFuentes}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Capacidad acumulada
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {capacidadTotal.toLocaleString()} L
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {stats.map((item) => (
          <MetricCard key={item.title} item={item} />
        ))}
      </section>

      <section className="rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Administración de fuentes
            </h2>
            <p className="text-sm text-muted-foreground">
              Crea, edita y consulta la infraestructura de almacenamiento o captación.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-border/70"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['fuentes-agua'] })
                queryClient.invalidateQueries({ queryKey: ['tipos-fuente-agua'] })
                queryClient.invalidateQueries({ queryKey: ['estados-fuente-agua'] })
                queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar
            </Button>

            <Button
              variant="outline"
              className="rounded-xl border-border/70"
              onClick={handleExportCSV}
              disabled={isExporting || filteredFuentes.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>

            <Button
              variant="outline"
              className="rounded-xl border-border/70"
              onClick={handleExportExcel}
              disabled={isExporting || filteredFuentes.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>

            <Button
              variant="outline"
              className="rounded-xl border-border/70"
              onClick={handleExportPDF}
              disabled={isExporting || filteredFuentes.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>

            <Dialog
              open={open}
              onOpenChange={(value) => {
                if (!value) {
                  resetFormAndClose()
                  return
                }
                setOpen(true)
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={openCreateModal}
                  className="rounded-xl bg-sky-600 text-white shadow-sm hover:bg-sky-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva fuente
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 sm:max-w-3xl">
                <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
                  <DialogTitle className="text-xl">
                    {editingFuente ? 'Editar fuente' : 'Crear fuente'}
                  </DialogTitle>
                  <DialogDescription>
                    Completa los datos operativos y descriptivos de la fuente de agua.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="codigo" className="text-sm font-medium">
                        Código *
                      </Label>
                      <Input
                        id="codigo"
                        value={form.codigo}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, codigo: e.target.value }))
                        }
                        placeholder="FA-001"
                        className="h-11 rounded-xl border-border/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nombre" className="text-sm font-medium">
                        Nombre *
                      </Label>
                      <Input
                        id="nombre"
                        value={form.nombre}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, nombre: e.target.value }))
                        }
                        placeholder="Tanque principal"
                        className="h-11 rounded-xl border-border/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Ubicación</Label>
                      <Select
                        value={form.ubicacion_id}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, ubicacion_id: value }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background">
                          <SelectValue placeholder="Selecciona una ubicación" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/70">
                          <SelectItem value="none">Sin ubicación</SelectItem>
                          {ubicacionesData.map((ubicacion) => (
                            <SelectItem key={ubicacion.id} value={String(ubicacion.id)}>
                              {ubicacion.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capacidad_l" className="text-sm font-medium">
                        Capacidad (L)
                      </Label>
                      <Input
                        id="capacidad_l"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.capacidad_l}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, capacidad_l: e.target.value }))
                        }
                        placeholder="1000"
                        className="h-11 rounded-xl border-border/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tipo *</Label>
                      <Select
                        value={form.tipo_fuente_agua_id || undefined}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, tipo_fuente_agua_id: value }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background">
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/70">
                          {tiposData.map((tipo) => (
                            <SelectItem key={tipo.id} value={String(tipo.id)}>
                              {tipo.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Estado *</Label>
                      <Select
                        value={form.estado_fuente_agua_id || undefined}
                        onValueChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            estado_fuente_agua_id: value,
                          }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background">
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/70">
                          {estadosData.map((estado) => (
                            <SelectItem key={estado.id} value={String(estado.id)}>
                              {estado.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="descripcion" className="text-sm font-medium">
                        Descripción
                      </Label>
                      <Textarea
                        id="descripcion"
                        value={form.descripcion}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, descripcion: e.target.value }))
                        }
                        placeholder="Describe la fuente de agua"
                        className="min-h-[110px] rounded-xl border-border/70"
                      />
                    </div>
                  </div>

                  {apiError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                      {apiError}
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetFormAndClose}
                      className="rounded-xl border-border/70"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        tiposQuery.isLoading ||
                        estadosQuery.isLoading ||
                        ubicacionesQuery.isLoading
                      }
                      className="rounded-xl bg-sky-600 text-white hover:bg-sky-700"
                    >
                      {isSubmitting
                        ? 'Guardando...'
                        : editingFuente
                          ? 'Actualizar'
                          : 'Crear'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {(fuentesQuery.error ||
          tiposQuery.error ||
          estadosQuery.error ||
          ubicacionesQuery.error) && (
          <div className="px-5 pt-5">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              Error al cargar el módulo de fuentes de agua.
            </div>
          </div>
        )}

        {/* Filtros en tiempo real */}
        <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por id, código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-xl border-border/70 pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background w-full md:w-44">
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
              <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background w-full md:w-44">
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

            <Select value={filtroUbicacion} onValueChange={setFiltroUbicacion}>
              <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background w-full md:w-44">
                <SelectValue placeholder="Filtrar por ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {ubicacionesData.map((ubicacion) => (
                  <SelectItem key={ubicacion.id} value={String(ubicacion.id)}>
                    {ubicacion.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              {totalFuentes} resultado{totalFuentes === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="overflow-hidden rounded-2xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-12">ID</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {fuentesQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-28 text-center text-muted-foreground">
                      Cargando fuentes de agua...
                    </TableCell>
                  </TableRow>
                ) : filteredFuentes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-28 text-center text-muted-foreground">
                      No se encontraron fuentes de agua con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFuentes.map((fuente) => {
                    const tipoNombre =
                      tiposMap.get(fuente.tipo_fuente_agua_id) ??
                      `Tipo #${fuente.tipo_fuente_agua_id}`

                    const estadoNombre =
                      estadosMap.get(fuente.estado_fuente_agua_id) ??
                      `Estado #${fuente.estado_fuente_agua_id}`

                    const ubicacionNombre =
                      fuente.ubicacion_id != null
                        ? ubicacionesMap.get(fuente.ubicacion_id) ??
                          `Ubicación #${fuente.ubicacion_id}`
                        : '—'

                    return (
                      <TableRow
                        key={fuente.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="font-medium">{fuente.id}</TableCell>

                        <TableCell className="font-semibold text-foreground">
                          <div className="inline-flex items-center gap-2">
                            <span className="rounded-lg bg-sky-50 p-1.5 text-sky-700 dark:bg-sky-950/20 dark:text-sky-300">
                              <Waves className="h-3.5 w-3.5" />
                            </span>
                            {fuente.codigo}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium text-foreground">
                            {fuente.nombre}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {ubicacionNombre}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span
                            className={[
                              'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                              getTipoClasses(tipoNombre),
                            ].join(' ')}
                          >
                            {tipoNombre}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="inline-flex items-center gap-2 text-sm">
                            <CircleGauge className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {formatCapacity(fuente.capacidad_l)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span
                            className={[
                              'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                              getEstadoClasses(estadoNombre),
                            ].join(' ')}
                          >
                            {estadoNombre}
                          </span>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(fuente.creado_en).toLocaleString()}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
                              onClick={() => openEditModal(fuente)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20"
                              onClick={() => {
                                if (window.confirm(`¿Eliminar la fuente ${fuente.nombre}?`)) {
                                  deleteMutation.mutate(fuente.id)
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
        </div>
      </section>
    </div>
  )
}