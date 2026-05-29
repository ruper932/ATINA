// src/pages/dashboard/AtrapanieblasPage.tsx
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wind,
  MapPin,
  Ruler,
  Download,
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import Papa from 'papaparse'

import { atrapanieblasService } from '@/services/atrapanieblas.service'
import { ubicacionesService } from '@/services/ubicaciones.service'
import { catalogosService, type CatalogoBasico } from '@/services/catalogos.service'
import type {
  AtrapanieblaCreatePayload,
  AtrapanieblaResponse,
  AtrapanieblaUpdatePayload,
} from '@/types/atrapaniebla'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  ubicacion_id: string
  codigo: string
  nombre: string
  area_malla_m2: string
  tipo_malla: string
  orientacion: string
  estado_atrapaniebla_id: string
  fecha_instalacion: string
}

const initialForm: FormState = {
  ubicacion_id: '',
  codigo: '',
  nombre: '',
  area_malla_m2: '',
  tipo_malla: '',
  orientacion: '',
  estado_atrapaniebla_id: '',
  fecha_instalacion: '',
}

function formatArea(value: string | number | null | undefined) {
  const num = Number(value)
  if (Number.isNaN(num)) return '-'
  return `${num.toFixed(2)} m²`
}

function getEstadoClasses(nombre?: string) {
  const label = nombre?.toLowerCase() ?? ''

  if (
    label.includes('activo') ||
    label.includes('operativo') ||
    label.includes('funcional')
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300'
  }

  if (
    label.includes('mantenimiento') ||
    label.includes('pendiente') ||
    label.includes('proceso')
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300'
  }

  if (
    label.includes('inactivo') ||
    label.includes('dañado') ||
    label.includes('error')
  ) {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300'
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

export default function AtrapanieblasPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AtrapanieblaResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Filtros en tiempo real
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('all')
  const [filtroEstado, setFiltroEstado] = useState<string>('all')

  const atrapanieblasQuery = useQuery({
    queryKey: ['atrapanieblas'],
    queryFn: atrapanieblasService.getAll,
  })

  const ubicacionesQuery = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: ubicacionesService.getAll,
  })

  const estadosQuery = useQuery({
    queryKey: ['estados-atrapaniebla'],
    queryFn: catalogosService.getEstadosAtrapaniebla,
  })

  const createMutation = useMutation({
    mutationFn: (payload: AtrapanieblaCreatePayload) =>
      atrapanieblasService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['atrapanieblas'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: AtrapanieblaUpdatePayload
    }) => atrapanieblasService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['atrapanieblas'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => atrapanieblasService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['atrapanieblas'] })
    },
    onError: handleMutationError,
  })

  function handleMutationError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail
      setApiError(
        typeof detail === 'string'
          ? detail
          : 'Ocurrió un error en la operación.'
      )
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

  function openEditModal(item: AtrapanieblaResponse) {
    setEditingItem(item)
    setForm({
      ubicacion_id: String(item.ubicacion_id),
      codigo: item.codigo,
      nombre: item.nombre,
      area_malla_m2: String(item.area_malla_m2),
      tipo_malla: item.tipo_malla ?? '',
      orientacion: item.orientacion ?? '',
      estado_atrapaniebla_id: String(item.estado_atrapaniebla_id),
      fecha_instalacion: item.fecha_instalacion ?? '',
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
      !form.ubicacion_id ||
      !form.area_malla_m2 ||
      !form.estado_atrapaniebla_id
    ) {
      setApiError('Completa todos los campos obligatorios (*).')
      return
    }

    const payloadBase = {
      ubicacion_id: Number(form.ubicacion_id),
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      area_malla_m2: Number(form.area_malla_m2),
      tipo_malla: form.tipo_malla.trim() || null,
      orientacion: form.orientacion.trim() || null,
      estado_atrapaniebla_id: Number(form.estado_atrapaniebla_id),
      fecha_instalacion: form.fecha_instalacion || null,
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload: payloadBase })
    } else {
      createMutation.mutate(payloadBase)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // Datos base
  const atrapanieblasData = atrapanieblasQuery.data ?? []
  const ubicacionesData = ubicacionesQuery.data ?? []
  const estadosData = estadosQuery.data ?? []

  // Aplicar filtros en tiempo real (búsqueda + ubicación + estado)
  const filteredItems = useMemo(() => {
    let items = atrapanieblasData

    // Búsqueda por texto
    const term = search.toLowerCase().trim()
    if (term) {
      items = items.filter(
        (item) =>
          String(item.id).includes(term) ||
          item.codigo.toLowerCase().includes(term) ||
          item.nombre.toLowerCase().includes(term)
      )
    }

    // Filtro por ubicación
    if (filtroUbicacion !== 'all') {
      items = items.filter((item) => String(item.ubicacion_id) === filtroUbicacion)
    }

    // Filtro por estado
    if (filtroEstado !== 'all') {
      items = items.filter((item) => String(item.estado_atrapaniebla_id) === filtroEstado)
    }

    return items
  }, [atrapanieblasData, search, filtroUbicacion, filtroEstado])

  const totalItems = filteredItems.length

  // Preparar datos para exportación
  const exportRows = useMemo(() => {
    return filteredItems.map((item) => {
      const ubi = ubicacionesData.find((u) => u.id === item.ubicacion_id)
      const est = estadosData.find((e) => e.id === item.estado_atrapaniebla_id)

      return {
        Código: item.codigo,
        Nombre: item.nombre,
        Ubicación: ubi?.nombre ?? `ID: ${item.ubicacion_id}`,
        'Área (m²)': item.area_malla_m2,
        'Tipo Malla': item.tipo_malla || '—',
        Orientación: item.orientacion || '—',
        Estado: est?.nombre ?? `ID: ${item.estado_atrapaniebla_id}`,
        'Fecha Instalación': item.fecha_instalacion || '—',
      }
    })
  }, [filteredItems, ubicacionesData, estadosData])

  // Funciones de exportación
  async function handleExportCSV() {
    try {
      setIsExporting(true)
      const csv = Papa.unparse(exportRows)
      downloadBlob(csv, `atrapanieblas-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`, 'text/csv;charset=utf-8;')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportExcel() {
    try {
      setIsExporting(true)
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Atrapanieblas')

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
      downloadBlob(buffer, `atrapanieblas-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportPDF() {
    try {
      setIsExporting(true)
      const doc = new jsPDF('landscape', 'pt', 'a4')
      doc.setFontSize(16)
      doc.text('Listado de Atrapanieblas', 40, 30)
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

      doc.save(`atrapanieblas-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-emerald-50 via-background to-teal-50 shadow-sm dark:from-emerald-950/20 dark:via-background dark:to-teal-950/10">
        <div className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
              <Wind className="h-3.5 w-3.5" />
              Captación atmosférica
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Atrapanieblas
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
              Gestiona las estructuras de captación de agua, su ubicación, superficie
              de malla y estado operativo dentro del sistema.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Registros visibles
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {totalItems}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Consulta
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                Gestión técnica y operativa
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Administración de registros
            </h2>
            <p className="text-sm text-muted-foreground">
              Busca, filtra, exporta y registra nuevas unidades de atrapanieblas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-border/70"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['atrapanieblas'] })
                queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
                queryClient.invalidateQueries({ queryKey: ['estados-atrapaniebla'] })
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar
            </Button>

            <Button
              variant="outline"
              className="rounded-xl border-border/70"
              onClick={handleExportCSV}
              disabled={isExporting || filteredItems.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>

            <Button
              variant="outline"
              className="rounded-xl border-border/70"
              onClick={handleExportExcel}
              disabled={isExporting || filteredItems.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>

            <Button
              variant="outline"
              className="rounded-xl border-border/70"
              onClick={handleExportPDF}
              disabled={isExporting || filteredItems.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>

            <Dialog
              open={open}
              onOpenChange={(val) => {
                setOpen(val)
                if (!val) resetFormAndClose()
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={openCreateModal}
                  className="rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo atrapaniebla
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 sm:max-w-3xl">
                <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
                  <DialogTitle className="text-xl">
                    {editingItem ? 'Editar atrapaniebla' : 'Crear atrapaniebla'}
                  </DialogTitle>
                  <DialogDescription>
                    Registra los detalles técnicos, ubicación y estado de la malla de
                    captación.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Ubicación *</Label>
                      <Select
                        value={form.ubicacion_id || undefined}
                        onValueChange={(val) =>
                          setForm((p) => ({ ...p, ubicacion_id: val }))
                        }
                        disabled={ubicacionesQuery.isLoading}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background">
                          <SelectValue
                            placeholder={
                              ubicacionesQuery.isLoading
                                ? 'Cargando ubicaciones...'
                                : 'Selecciona una ubicación'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="z-[100] max-h-[300px] rounded-xl border-border/70">
                          {ubicacionesData.map((u) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Estado *</Label>
                      <Select
                        value={form.estado_atrapaniebla_id || undefined}
                        onValueChange={(val) =>
                          setForm((p) => ({
                            ...p,
                            estado_atrapaniebla_id: val,
                          }))
                        }
                        disabled={estadosQuery.isLoading}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background">
                          <SelectValue
                            placeholder={
                              estadosQuery.isLoading
                                ? 'Cargando...'
                                : 'Seleccionar estado'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/70">
                          {estadosData.map((e: CatalogoBasico) => (
                            <SelectItem key={e.id} value={String(e.id)}>
                              {e.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Código *</Label>
                      <Input
                        value={form.codigo}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, codigo: e.target.value }))
                        }
                        placeholder="AT-001"
                        maxLength={30}
                        className="h-11 rounded-xl border-border/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Nombre *</Label>
                      <Input
                        value={form.nombre}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, nombre: e.target.value }))
                        }
                        placeholder="Malla principal"
                        maxLength={100}
                        className="h-11 rounded-xl border-border/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Área de malla (m²) *
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.area_malla_m2}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            area_malla_m2: e.target.value,
                          }))
                        }
                        placeholder="12.5"
                        className="h-11 rounded-xl border-border/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Fecha de instalación
                      </Label>
                      <Input
                        type="date"
                        value={form.fecha_instalacion}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            fecha_instalacion: e.target.value,
                          }))
                        }
                        className="h-11 rounded-xl border-border/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tipo de malla</Label>
                      <Input
                        value={form.tipo_malla}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            tipo_malla: e.target.value,
                          }))
                        }
                        placeholder="Raschel 35%"
                        className="h-11 rounded-xl border-border/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Orientación</Label>
                      <Input
                        value={form.orientacion}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            orientacion: e.target.value,
                          }))
                        }
                        placeholder="Sur-Oeste"
                        className="h-11 rounded-xl border-border/70"
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
                      disabled={isSubmitting}
                      className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {isSubmitting ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filtros en tiempo real */}
        <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-xl border-border/70 pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={filtroUbicacion} onValueChange={setFiltroUbicacion}>
              <SelectTrigger className="h-11 w-full rounded-xl border-border/70 bg-background md:w-48">
                <SelectValue placeholder="Filtrar por ubicación" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/70">
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {ubicacionesData.map((ubi) => (
                  <SelectItem key={ubi.id} value={String(ubi.id)}>
                    {ubi.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="h-11 w-full rounded-xl border-border/70 bg-background md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/70">
                <SelectItem value="all">Todos los estados</SelectItem>
                {estadosData.map((est) => (
                  <SelectItem key={est.id} value={String(est.id)}>
                    {est.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              {totalItems} resultado{totalItems === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="overflow-hidden rounded-2xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-12">Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {atrapanieblasQuery.isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-28 text-center text-muted-foreground"
                    >
                      Cargando atrapanieblas...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-28 text-center text-muted-foreground"
                    >
                      No se encontraron registros con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const ubi = ubicacionesData.find(
                      (u) => u.id === item.ubicacion_id
                    )
                    const est = estadosData.find(
                      (e) => e.id === item.estado_atrapaniebla_id
                    )

                    return (
                      <TableRow
                        key={item.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="font-semibold text-foreground">
                          <div className="inline-flex items-center gap-2">
                            <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
                              <Wind className="h-3.5 w-3.5" />
                            </span>
                            {item.codigo}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium text-foreground">
                            {item.nombre}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {ubi ? ubi.nombre : `ID: ${item.ubicacion_id}`}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="inline-flex items-center gap-2 text-sm">
                            <Ruler className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {formatArea(item.area_malla_m2)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span
                            className={[
                              'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                              getEstadoClasses(est?.nombre),
                            ].join(' ')}
                          >
                            {est ? est.nombre : `ID: ${item.estado_atrapaniebla_id}`}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
                              onClick={() => openEditModal(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20"
                              onClick={() => {
                                if (window.confirm(`¿Eliminar ${item.nombre}?`)) {
                                  deleteMutation.mutate(item.id)
                                }
                              }}
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