import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  Warehouse,
  MapPinned,
  Ruler,
  Sprout,
  Info,
  Download,
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import Papa from 'papaparse'

import { invernaderosService } from '@/services/invernaderos.service'
import { ubicacionesService } from '@/services/ubicaciones.service'
import { infraestructuraCatalogosService } from '@/services/infraestructura-catalogos.service'
import type {
  InvernaderoCreatePayload,
  InvernaderoResponse,
  InvernaderoUpdatePayload,
} from '@/types/invernadero'
import type { UbicacionResponse } from '@/types/ubicacion'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

type CatalogoOption = {
  id: number
  nombre: string
  descripcion?: string | null
}

type FormState = {
  ubicacion_id: string
  codigo: string
  nombre: string
  descripcion: string
  area_m2: string
  prioridad_riego: string
  estado_invernadero_id: string
}

const initialForm: FormState = {
  ubicacion_id: '',
  codigo: '',
  nombre: '',
  descripcion: '',
  area_m2: '',
  prioridad_riego: '1',
  estado_invernadero_id: '',
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

  if (value.includes('activo') || value.includes('operativo') || value.includes('habilitado')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
  }

  return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300'
}

function formatArea(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return `${value} m²`
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
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

export default function InvernaderosPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InvernaderoResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Filtros en tiempo real
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('all')
  const [filtroEstado, setFiltroEstado] = useState<string>('all')

  const invernaderosQuery = useQuery({
    queryKey: ['invernaderos'],
    queryFn: invernaderosService.getAll,
  })

  const ubicacionesQuery = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: ubicacionesService.getAll,
  })

  const estadosInvernaderoQuery = useQuery({
    queryKey: ['catalogos', 'estados-invernadero'],
    queryFn: infraestructuraCatalogosService.getEstadosInvernadero,
  })

  const createMutation = useMutation({
    mutationFn: (payload: InvernaderoCreatePayload) => invernaderosService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invernaderos'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: InvernaderoUpdatePayload }) =>
      invernaderosService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invernaderos'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => invernaderosService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invernaderos'] })
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

  function openEditModal(item: InvernaderoResponse) {
    setEditingItem(item)
    setForm({
      ubicacion_id: String(item.ubicacion_id),
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      area_m2: String(item.area_m2),
      prioridad_riego: String(item.prioridad_riego),
      estado_invernadero_id: String(item.estado_invernadero_id),
    })
    setApiError(null)
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    if (
      !form.ubicacion_id ||
      !form.codigo.trim() ||
      !form.nombre.trim() ||
      !form.area_m2 ||
      !form.prioridad_riego ||
      !form.estado_invernadero_id
    ) {
      setApiError('Completa todos los campos obligatorios.')
      return
    }

    const payloadBase: InvernaderoCreatePayload = {
      ubicacion_id: Number(form.ubicacion_id),
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      area_m2: Number(form.area_m2),
      prioridad_riego: Number(form.prioridad_riego),
      estado_invernadero_id: Number(form.estado_invernadero_id),
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload: payloadBase })
    } else {
      createMutation.mutate(payloadBase)
    }
  }

  const ubicaciones = ubicacionesQuery.data ?? []
  const estadosInvernadero = estadosInvernaderoQuery.data ?? []
  const invernaderos = invernaderosQuery.data ?? []
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // Aplicar filtros en tiempo real (búsqueda + ubicación + estado)
  const filteredItems = useMemo(() => {
    let items = invernaderos

    // Búsqueda por texto
    const term = search.toLowerCase().trim()
    if (term) {
      items = items.filter(
        (item) =>
          String(item.id).includes(term) ||
          item.codigo.toLowerCase().includes(term) ||
          item.nombre.toLowerCase().includes(term) ||
          (item.ubicacion_nombre ?? '').toLowerCase().includes(term) ||
          (item.estado_invernadero_nombre ?? '').toLowerCase().includes(term)
      )
    }

    // Filtro por ubicación
    if (filtroUbicacion !== 'all') {
      items = items.filter((item) => String(item.ubicacion_id) === filtroUbicacion)
    }

    // Filtro por estado
    if (filtroEstado !== 'all') {
      items = items.filter((item) => String(item.estado_invernadero_id) === filtroEstado)
    }

    return items
  }, [invernaderos, search, filtroUbicacion, filtroEstado])

  const totalInvernaderos = invernaderos.length
  const activos = invernaderos.filter((item) => {
    const estadoNombre =
      item.estado_invernadero_nombre ??
      estadosInvernadero.find((estado: CatalogoOption) => estado.id === item.estado_invernadero_id)
        ?.nombre ??
      ''

    const normalized = estadoNombre.trim().toLowerCase()
    return (
      normalized.includes('activo') ||
      normalized.includes('operativo') ||
      normalized.includes('habilitado')
    )
  }).length

  const areaTotal = invernaderos.reduce((acc, item) => acc + Number(item.area_m2 ?? 0), 0)
  const prioridadesAltas = invernaderos.filter((item) => Number(item.prioridad_riego) >= 7).length

  // Preparar datos para exportación (solo los filtrados)
  const exportRows = useMemo(() => {
    return filteredItems.map((item) => {
      const ubicacion = ubicaciones.find((u) => u.id === item.ubicacion_id)
      const estado = estadosInvernadero.find((e: CatalogoOption) => e.id === item.estado_invernadero_id)

      return {
        ID: item.id,
        Código: item.codigo,
        Nombre: item.nombre,
        Ubicación: ubicacion?.nombre ?? item.ubicacion_nombre ?? `ID: ${item.ubicacion_id}`,
        'Área (m²)': item.area_m2,
        'Prioridad Riego': item.prioridad_riego,
        Estado: estado?.nombre ?? item.estado_invernadero_nombre ?? `ID: ${item.estado_invernadero_id}`,
        Descripción: item.descripcion || '—',
        Creado: formatDateTime(item.creado_en),
      }
    })
  }, [filteredItems, ubicaciones, estadosInvernadero])

  // Funciones de exportación
  async function handleExportCSV() {
    try {
      setIsExporting(true)
      const csv = Papa.unparse(exportRows)
      downloadBlob(csv, `invernaderos-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`, 'text/csv;charset=utf-8;')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportExcel() {
    try {
      setIsExporting(true)
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Invernaderos')

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
      downloadBlob(buffer, `invernaderos-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportPDF() {
    try {
      setIsExporting(true)
      const doc = new jsPDF('landscape', 'pt', 'a4')
      doc.setFontSize(16)
      doc.text('Listado de Invernaderos', 40, 30)
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

      doc.save(`invernaderos-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  const stats: StatCard[] = [
    {
      title: 'Invernaderos',
      value: String(totalInvernaderos),
      helper: 'Infraestructura registrada',
      icon: Warehouse,
      tone: 'emerald',
    },
    {
      title: 'Activos',
      value: String(activos),
      helper: 'Con estado operativo',
      icon: Sprout,
      tone: 'teal',
    },
    {
      title: 'Área total',
      value: `${areaTotal} m²`,
      helper: 'Superficie acumulada registrada',
      icon: Ruler,
      tone: 'blue',
    },
    {
      title: 'Prioridad alta',
      value: String(prioridadesAltas),
      helper: 'Con prioridad de riego elevada (≥7)',
      icon: Info,
      tone: 'violet',
    },
  ]

  return (
    <div className="min-h-full space-y-6 bg-background">
      <section className="rounded-[28px] border border-border/70 bg-card px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300"
            >
              Infraestructura productiva
            </Badge>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Invernaderos
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              Gestiona los invernaderos registrados en el sistema y controla su ubicación, estado,
              área y prioridad operativa.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['invernaderos'] })
                queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
                queryClient.invalidateQueries({ queryKey: ['catalogos', 'estados-invernadero'] })
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
                  Nuevo invernadero
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] border border-border/70 bg-card sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-foreground">
                    {editingItem ? 'Editar invernadero' : 'Crear invernadero'}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-6">
                    Completa los datos principales del invernadero.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Ubicación *</Label>
                      <Select
                        value={form.ubicacion_id}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, ubicacion_id: value }))
                        }
                        disabled={ubicacionesQuery.isLoading || ubicacionesQuery.error !== null}
                      >
                        <SelectTrigger className="rounded-2xl border-border/70 bg-background">
                          <SelectValue
                            placeholder={
                              ubicacionesQuery.isLoading
                                ? 'Cargando ubicaciones...'
                                : 'Selecciona una ubicación'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {ubicaciones.map((u: UbicacionResponse) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Estado *</Label>
                      <Select
                        value={form.estado_invernadero_id}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, estado_invernadero_id: value }))
                        }
                        disabled={
                          estadosInvernaderoQuery.isLoading || estadosInvernaderoQuery.error !== null
                        }
                      >
                        <SelectTrigger className="rounded-2xl border-border/70 bg-background">
                          <SelectValue
                            placeholder={
                              estadosInvernaderoQuery.isLoading
                                ? 'Cargando estados...'
                                : 'Selecciona un estado'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {estadosInvernadero.map((estado: CatalogoOption) => (
                            <SelectItem key={estado.id} value={String(estado.id)}>
                              {estado.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código *</Label>
                      <Input
                        id="codigo"
                        value={form.codigo}
                        onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
                        placeholder="INV-001"
                        maxLength={30}
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={form.nombre}
                        onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                        placeholder="Invernadero central"
                        maxLength={100}
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="area_m2">Área m² *</Label>
                      <Input
                        id="area_m2"
                        type="number"
                        step="0.01"
                        value={form.area_m2}
                        onChange={(e) => setForm((prev) => ({ ...prev, area_m2: e.target.value }))}
                        placeholder="120.50"
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prioridad_riego">Prioridad de riego *</Label>
                      <Input
                        id="prioridad_riego"
                        type="number"
                        min="1"
                        max="10"
                        value={form.prioridad_riego}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, prioridad_riego: e.target.value }))
                        }
                        placeholder="1"
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        value={form.descripcion}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, descripcion: e.target.value }))
                        }
                        placeholder="Descripción del invernadero"
                        className="min-h-[110px] rounded-2xl border-border/70 bg-background"
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

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.title} className="rounded-[20px] border border-border/70 bg-card shadow-none">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {item.title}
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{item.value}</p>
              </div>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${toneMap[item.tone]}`}
              >
                <item.icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <SurfaceCard
          title="Listado de invernaderos"
          description="Filtra por código, nombre, ubicación o estado en tiempo real."
          action={
            <div className="flex flex-col gap-3 w-full md:flex-row md:items-center">
              <div className="relative w-full md:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código o nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 rounded-2xl border-border/70 bg-background pl-9"
                />
              </div>
              <Select value={filtroUbicacion} onValueChange={setFiltroUbicacion}>
                <SelectTrigger className="h-11 rounded-2xl border-border/70 bg-background w-full md:w-48">
                  <SelectValue placeholder="Filtrar por ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ubicaciones</SelectItem>
                  {ubicaciones.map((ubi: UbicacionResponse) => (
                    <SelectItem key={ubi.id} value={String(ubi.id)}>
                      {ubi.nombre}
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
                  {estadosInvernadero.map((est: CatalogoOption) => (
                    <SelectItem key={est.id} value={String(est.id)}>
                      {est.nombre}
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
          <div className="overflow-x-auto rounded-[22px] border border-border/70">
            <Table className="min-w-[1100px] table-auto">
              <TableHeader>
                <TableRow className="border-b border-border/70 bg-muted/40">
                  <TableHead className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    ID
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Código
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Nombre
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Ubicación
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Área m²
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Prioridad
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Estado
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Creado
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {invernaderosQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      Cargando invernaderos...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      No se encontraron invernaderos con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const ubicacion = ubicaciones.find((u) => u.id === item.ubicacion_id)
                    const ubicacionLabel =
                      item.ubicacion_nombre ?? ubicacion?.nombre ?? 'Sin ubicación'
                    const estadoLabel = item.estado_invernadero_nombre ?? 'Sin estado'

                    return (
                      <TableRow
                        key={item.id}
                        className="border-b border-border/70 transition-colors hover:bg-accent/30"
                      >
                        <TableCell className="whitespace-nowrap font-medium text-foreground">
                          {item.id}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium text-foreground">
                          {item.codigo}
                        </TableCell>
                        <TableCell className="min-w-[220px] text-foreground">
                          {item.nombre}
                        </TableCell>
                        <TableCell className="min-w-[220px] text-muted-foreground">
                          {ubicacionLabel}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatArea(
                            typeof item.area_m2 === 'number'
                              ? item.area_m2
                              : item.area_m2
                                ? Number(item.area_m2)
                                : null
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {item.prioridad_riego}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className={`rounded-full border ${getEstadoBadgeClass(estadoLabel)}`}
                          >
                            {estadoLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(item.creado_en)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
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
                                if (window.confirm(`¿Eliminar ${item.nombre}?`)) {
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
      </section>
    </div>
  )
}