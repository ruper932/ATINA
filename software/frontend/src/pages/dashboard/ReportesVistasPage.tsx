import React, { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  Search,
  Download,
  RefreshCw,
  Printer,
  BarChart3,
  Filter,
  Database,
  Waves,
  BellRing,
  Cpu,
  Droplets,
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'

import { reportesService } from '@/services/reportes.service'
import type {
  AlertasFilters,
  InventarioFilters,
  LecturasFilters,
  PrediccionesFilters,
  ReportType,
  RiegoFilters,
  VReporteAlertasInvernadero,
  VReporteInventarioDispositivos,
  VReporteLecturasSensor,
  VReportePrediccionesAgua,
  VReporteRiegoEjecutado,
} from '@/types/reportes'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const initialLecturasFilters: LecturasFilters = {
  q: '',
  sensor_codigo: '',
  sensor_nombre: '',
  fecha_desde: '',
  fecha_hasta: '',
  skip: 0,
  limit: 20,
}

const initialAlertasFilters: AlertasFilters = {
  q: '',
  tipo_alerta: '',
  mensaje: '',
  invernadero_id: '',
  fecha_desde: '',
  fecha_hasta: '',
  skip: 0,
  limit: 20,
}

const initialInventarioFilters: InventarioFilters = {
  q: '',
  codigo: '',
  nombre: '',
  tipo_dispositivo: '',
  estado_dispositivo_id: '',
  skip: 0,
  limit: 20,
}

const initialRiegoFilters: RiegoFilters = {
  q: '',
  invernadero_id: '',
  texto_decision: '',
  fecha_desde: '',
  fecha_hasta: '',
  skip: 0,
  limit: 20,
}

const initialPrediccionesFilters: PrediccionesFilters = {
  q: '',
  fuente_agua: '',
  modelo_usado: '',
  fecha_desde: '',
  fecha_hasta: '',
  skip: 0,
  limit: 20,
}

type Column<T, K extends keyof T = keyof T> = {
  key: K
  label: string
  className?: string
  render?: (value: T[K], row: T) => React.ReactNode
}

type ReportTableProps<T extends object> = {
  data: T[]
  columns: Column<T>[]
  emptyMessage: string
  getRowKey?: (row: T, index: number) => React.Key
}

type StatCard = {
  label: string
  value: string
  helper?: string
  tone?: 'emerald' | 'teal' | 'amber' | 'rose' | 'neutral'
}

type ChartDatum = {
  name: string
  value: number
}

const limitOptions = [10, 20, 50, 100]

function toParams<T extends object>(filters: T): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== '' && value !== null && value !== undefined
    )
  ) as Record<string, string | number>
}

function stripPagination<T extends { skip?: number; limit?: number }>(filters: T) {
  const { skip, limit, ...rest } = filters
  return rest
}

function formatDateTime(value: unknown) {
  if (typeof value !== 'string') return value != null ? String(value) : '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatDate(value: unknown) {
  if (typeof value !== 'string') return value != null ? String(value) : '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function formatDecimal(value: unknown) {
  const num = Number(value)
  if (Number.isNaN(num)) return value != null ? String(value) : '—'
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
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
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">{title}</CardTitle>
            {description ? (
              <CardDescription className="mt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function InputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  id: string
  label: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border-border/70 bg-background"
      />
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  options: { value: number; label: string }[]
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex h-10 w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function StatusBadge({ label }: { label: string }) {
  const lower = label.toLowerCase()
  const classes = lower.includes('activo') || lower.includes('stock') || lower.includes('ok')
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
    : lower.includes('inactivo') || lower.includes('crit') || lower.includes('out')
      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
      : lower.includes('mantenimiento') || lower.includes('revision') || lower.includes('revisión')
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
        : 'bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300'

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  )
}

function StatsCards({ stats }: { stats: StatCard[] }) {
  const toneMap = {
    emerald:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300',
    teal:
      'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/40 dark:bg-teal-950/20 dark:text-teal-300',
    amber:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300',
    rose:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300',
    neutral: 'border-border bg-muted text-foreground',
  } as const

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="rounded-[24px] border border-border/70 bg-card shadow-none"
        >
          <CardContent className="p-5">
            <div
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                toneMap[stat.tone ?? 'neutral']
              }`}
            >
              {stat.label}
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
            {stat.helper ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{stat.helper}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Gráfico de barras horizontal (izquierda)
function BarChartPanel({
  title,
  chartData,
}: {
  title: string
  chartData: ChartDatum[]
}) {
  if (!chartData.length) return null

  return (
    <SurfaceCard
      title={title}
      description="Distribución por categoría"
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.35} />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              width={120}
              fontSize={11}
            />
            <Tooltip
              cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }}
              contentStyle={{
                borderRadius: 16,
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--card))',
                boxShadow: 'none',
              }}
            />
            <Bar
              dataKey="value"
              radius={[0, 8, 8, 0]}
              fill="#10b981"
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SurfaceCard>
  )
}

// Gráfico de torta (dona) - derecha
function DonaChartPanel({
  title,
  data,
}: {
  title: string
  data: ChartDatum[]
}) {
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6b7280', '#3b82f6', '#8b5cf6', '#ec489a', '#14b8a6']

  if (!data.length) return null

  return (
    <SurfaceCard
      title={title}
      description="Distribución porcentual"
    >
      <div className="flex h-64 w-full items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => (percent ? `${(percent * 100).toFixed(0)}%` : name)}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} registros`, name]}
              contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
            />
            <Legend verticalAlign="bottom" height={36} layout="horizontal" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </SurfaceCard>
  )
}

function ReportTable<T extends object>({
  data,
  columns,
  emptyMessage,
  getRowKey,
}: ReportTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex h-52 flex-col items-center justify-center rounded-[22px] border border-dashed border-border/70 bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-border/70">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-muted/40">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}
                className="border-b border-border/70 transition-colors hover:bg-accent/30"
              >
                {columns.map((column) => {
                  const value = row[column.key]
                  return (
                    <td
                      key={String(column.key)}
                      className={`px-4 py-3 align-middle text-foreground ${column.className ?? ''}`}
                    >
                      {column.render
                        ? column.render(value, row)
                        : value !== null && value !== undefined
                          ? String(value)
                          : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PaginationControls({
  page,
  limit,
  rowsLoaded,
  onFirst,
  onPrevious,
  onNext,
  hasNext,
  hasPrevious,
}: {
  page: number
  limit: number
  rowsLoaded: number
  onFirst: () => void
  onPrevious: () => void
  onNext: () => void
  hasNext: boolean
  hasPrevious: boolean
}) {
  const start = rowsLoaded > 0 ? (page - 1) * limit + 1 : 0
  const end = rowsLoaded > 0 ? start + rowsLoaded - 1 : 0

  return (
    <SurfaceCard title="Paginación" description="Navega por el conjunto de resultados actual.">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            Mostrando {start}-{end}
          </p>
          <p className="text-xs text-muted-foreground">Página {page}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={onFirst} disabled={!hasPrevious}>
            Inicio
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={onPrevious} disabled={!hasPrevious}>
            Anterior
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={onNext} disabled={!hasNext}>
            Siguiente
          </Button>
        </div>
      </div>
    </SurfaceCard>
  )
}

function groupChartData<T>(rows: T[], getter: (row: T) => string): ChartDatum[] {
  const grouped = rows.reduce<Record<string, number>>((acc, row) => {
    const key = getter(row) || 'Sin categoría'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
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

function exportToCSV(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const escapeCell = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header] ?? '')).join(',')),
  ].join('\n')

  downloadBlob(csv, `${filename}.csv`, 'text/csv;charset=utf-8;')
}

async function exportToExcel(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Reporte')

  worksheet.columns = Object.keys(rows[0]).map((key) => ({
    header: key,
    key,
    width: Math.max(16, key.length + 4),
  }))

  rows.forEach((row) => worksheet.addRow(row))

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

  downloadBlob(
    buffer,
    `${filename}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
}

function exportToPDF(
  title: string,
  stats: StatCard[],
  rows: Record<string, string | number>[],
  filename: string
) {
  if (!rows.length) return

  const doc = new jsPDF('p', 'mm', 'a4')
  doc.setFontSize(18)
  doc.text(title, 14, 18)
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 26)

  let y = 34
  stats.forEach((stat) => {
    doc.text(`${stat.label}: ${stat.value}${stat.helper ? ` (${stat.helper})` : ''}`, 14, y)
    y += 6
  })

  autoTable(doc, {
    startY: y + 4,
    head: [Object.keys(rows[0])],
    body: rows.map((row) => Object.values(row).map((v) => String(v))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] },
    margin: { left: 14, right: 14 },
  })

  doc.save(`${filename}.pdf`)
}

function handlePrintPDF(
  title: string,
  stats: StatCard[],
  rows: Record<string, string | number>[],
  _filename: string
) {
  if (!rows.length) return

  const doc = new jsPDF('p', 'mm', 'a4')
  doc.setFontSize(18)
  doc.text(title, 14, 18)
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 26)

  let y = 34
  stats.forEach((stat) => {
    doc.text(`${stat.label}: ${stat.value}${stat.helper ? ` (${stat.helper})` : ''}`, 14, y)
    y += 6
  })

  autoTable(doc, {
    startY: y + 4,
    head: [Object.keys(rows[0])],
    body: rows.map((row) => Object.values(row).map((v) => String(v))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] },
    margin: { left: 14, right: 14 },
  })

  doc.autoPrint()
  const pdfBlob = doc.output('blob')
  const pdfUrl = URL.createObjectURL(pdfBlob)
  const iframe = document.createElement('iframe')
  iframe.style.position = 'absolute'
  iframe.style.width = '0px'
  iframe.style.height = '0px'
  iframe.style.border = 'none'
  iframe.src = pdfUrl
  document.body.appendChild(iframe)

  iframe.onload = () => {
    setTimeout(() => {
      document.body.removeChild(iframe)
      URL.revokeObjectURL(pdfUrl)
    }, 1000)
  }
}

export const ReportesVistasPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('lecturas')
  const [isExporting, setIsExporting] = useState(false)

  const [lecturasDraft, setLecturasDraft] = useState<LecturasFilters>(initialLecturasFilters)
  const [alertasDraft, setAlertasDraft] = useState<AlertasFilters>(initialAlertasFilters)
  const [inventarioDraft, setInventarioDraft] = useState<InventarioFilters>(initialInventarioFilters)
  const [riegoDraft, setRiegoDraft] = useState<RiegoFilters>(initialRiegoFilters)
  const [prediccionesDraft, setPrediccionesDraft] = useState<PrediccionesFilters>(initialPrediccionesFilters)

  const [lecturasApplied, setLecturasApplied] = useState<LecturasFilters>(initialLecturasFilters)
  const [alertasApplied, setAlertasApplied] = useState<AlertasFilters>(initialAlertasFilters)
  const [inventarioApplied, setInventarioApplied] = useState<InventarioFilters>(initialInventarioFilters)
  const [riegoApplied, setRiegoApplied] = useState<RiegoFilters>(initialRiegoFilters)
  const [prediccionesApplied, setPrediccionesApplied] = useState<PrediccionesFilters>(initialPrediccionesFilters)

  const [allEstadosOptions, setAllEstadosOptions] = useState<{ id: number; nombre: string }[]>([])

  useEffect(() => {
    const handler = window.setTimeout(() => {
      if (activeReport === 'lecturas') setLecturasApplied({ ...lecturasDraft, skip: 0 })
      if (activeReport === 'alertas') setAlertasApplied({ ...alertasDraft, skip: 0 })
      if (activeReport === 'inventario') setInventarioApplied({ ...inventarioDraft, skip: 0 })
      if (activeReport === 'riego') setRiegoApplied({ ...riegoDraft, skip: 0 })
      if (activeReport === 'predicciones') setPrediccionesApplied({ ...prediccionesDraft, skip: 0 })
    }, 350)

    return () => window.clearTimeout(handler)
  }, [
    activeReport,
    lecturasDraft,
    alertasDraft,
    inventarioDraft,
    riegoDraft,
    prediccionesDraft,
  ])

  useEffect(() => {
    if (activeReport === 'inventario') {
      const { estado_dispositivo_id, skip, limit, ...filters } = inventarioApplied
      reportesService.getInventarioDispositivosAll(filters).then((data) => {
        const estadoMap = new Map<number, string>()
        data.forEach((item) => {
          const id = item.estado_dispositivo_id
          const nombre = item.estado_dispositivo_nombre
          if (id && nombre && !estadoMap.has(id)) {
            estadoMap.set(id, nombre)
          }
        })
        setAllEstadosOptions(Array.from(estadoMap.entries()).map(([id, nombre]) => ({ id, nombre })))
      })
    }
  }, [activeReport, inventarioApplied.q, inventarioApplied.codigo, inventarioApplied.nombre, inventarioApplied.tipo_dispositivo])

  const tabs = [
    { id: 'lecturas' as const, label: 'Lecturas por sensor', icon: Waves },
    { id: 'alertas' as const, label: 'Alertas por invernadero', icon: BellRing },
    { id: 'inventario' as const, label: 'Inventario dispositivos', icon: Cpu },
    { id: 'riego' as const, label: 'Riego ejecutado', icon: Droplets },
    { id: 'predicciones' as const, label: 'Predicciones de agua', icon: BarChart3 },
  ]

  const activeTitle = useMemo(
    () => tabs.find((tab) => tab.id === activeReport)?.label ?? 'Reporte',
    [activeReport]
  )

  const lecturasQuery = useQuery<VReporteLecturasSensor[]>({
    queryKey: ['reporte-lecturas', lecturasApplied],
    queryFn: () => reportesService.getLecturasSensor(toParams(lecturasApplied)),
    enabled: activeReport === 'lecturas',
    placeholderData: (previousData) => previousData,
  })

  const alertasQuery = useQuery<VReporteAlertasInvernadero[]>({
    queryKey: ['reporte-alertas', alertasApplied],
    queryFn: () => reportesService.getAlertasInvernadero(toParams(alertasApplied)),
    enabled: activeReport === 'alertas',
    placeholderData: (previousData) => previousData,
  })

  const inventarioQuery = useQuery<VReporteInventarioDispositivos[]>({
    queryKey: ['reporte-inventario', inventarioApplied],
    queryFn: () => reportesService.getInventarioDispositivos(toParams(inventarioApplied)),
    enabled: activeReport === 'inventario',
    placeholderData: (previousData) => previousData,
  })

  const riegoQuery = useQuery<VReporteRiegoEjecutado[]>({
    queryKey: ['reporte-riego', riegoApplied],
    queryFn: () => reportesService.getRiegoEjecutado(toParams(riegoApplied)),
    enabled: activeReport === 'riego',
    placeholderData: (previousData) => previousData,
  })

  const prediccionesQuery = useQuery<VReportePrediccionesAgua[]>({
    queryKey: ['reporte-predicciones', prediccionesApplied],
    queryFn: () => reportesService.getPrediccionesAgua(toParams(prediccionesApplied)),
    enabled: activeReport === 'predicciones',
    placeholderData: (previousData) => previousData,
  })

  const currentQuery =
    activeReport === 'lecturas'
      ? lecturasQuery
      : activeReport === 'alertas'
        ? alertasQuery
        : activeReport === 'inventario'
          ? inventarioQuery
          : activeReport === 'riego'
            ? riegoQuery
            : prediccionesQuery

  function handleResetFilters() {
    if (activeReport === 'lecturas') {
      setLecturasDraft(initialLecturasFilters)
      setLecturasApplied(initialLecturasFilters)
    }
    if (activeReport === 'alertas') {
      setAlertasDraft(initialAlertasFilters)
      setAlertasApplied(initialAlertasFilters)
    }
    if (activeReport === 'inventario') {
      setInventarioDraft(initialInventarioFilters)
      setInventarioApplied(initialInventarioFilters)
    }
    if (activeReport === 'riego') {
      setRiegoDraft(initialRiegoFilters)
      setRiegoApplied(initialRiegoFilters)
    }
    if (activeReport === 'predicciones') {
      setPrediccionesDraft(initialPrediccionesFilters)
      setPrediccionesApplied(initialPrediccionesFilters)
    }
  }

  const currentData = currentQuery.data ?? []

  const currentAppliedFilters =
    activeReport === 'lecturas'
      ? lecturasApplied
      : activeReport === 'alertas'
        ? alertasApplied
        : activeReport === 'inventario'
          ? inventarioApplied
          : activeReport === 'riego'
            ? riegoApplied
            : prediccionesApplied

  const currentPage = Math.floor(currentAppliedFilters.skip / currentAppliedFilters.limit) + 1
  const currentLimit = currentAppliedFilters.limit
  const rowsLoaded = currentData.length
  const hasPrevious = currentAppliedFilters.skip > 0
  const hasNext = rowsLoaded === currentLimit

  function updateSkipForPage(nextPage: number) {
    const nextSkip = (nextPage - 1) * currentLimit

    if (activeReport === 'lecturas') setLecturasApplied((prev) => ({ ...prev, skip: nextSkip }))
    if (activeReport === 'alertas') setAlertasApplied((prev) => ({ ...prev, skip: nextSkip }))
    if (activeReport === 'inventario') setInventarioApplied((prev) => ({ ...prev, skip: nextSkip }))
    if (activeReport === 'riego') setRiegoApplied((prev) => ({ ...prev, skip: nextSkip }))
    if (activeReport === 'predicciones') setPrediccionesApplied((prev) => ({ ...prev, skip: nextSkip }))
  }

  function handleFirstPage() {
    updateSkipForPage(1)
  }

  function handlePreviousPage() {
    if (currentPage > 1) updateSkipForPage(currentPage - 1)
  }

  function handleNextPage() {
    if (hasNext) updateSkipForPage(currentPage + 1)
  }

  const reportStats = useMemo<StatCard[]>(() => {
    switch (activeReport) {
      case 'lecturas': {
        const data = lecturasQuery.data ?? []
        const values = data.map((row) => Number(row.lectura_valor)).filter((n) => !Number.isNaN(n))
        const total = values.length
        const avg = total ? values.reduce((a, b) => a + b, 0) / total : 0
        const min = total ? Math.min(...values) : 0
        const max = total ? Math.max(...values) : 0
        return [
          { label: 'Lecturas', value: String(data.length), tone: 'emerald' },
          { label: 'Promedio', value: formatDecimal(avg), tone: 'teal' },
          { label: 'Mínimo', value: formatDecimal(min), tone: 'amber' },
          { label: 'Máximo', value: formatDecimal(max), tone: 'neutral' },
        ]
      }

      case 'alertas': {
        const data = alertasQuery.data ?? []
        const byType = data.reduce<Record<string, number>>((acc, row) => {
          acc[row.tipo_alerta] = (acc[row.tipo_alerta] ?? 0) + 1
          return acc
        }, {})
        const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]
        return [
          { label: 'Alertas', value: String(data.length), tone: 'rose' },
          { label: 'Tipos', value: String(Object.keys(byType).length), tone: 'amber' },
          {
            label: 'Invernaderos',
            value: String(new Set(data.map((x) => x.invernadero_id)).size),
            tone: 'teal',
          },
          {
            label: 'Tipo principal',
            value: topType?.[0] ?? '—',
            helper: topType ? `${topType[1]} registros` : 'Sin datos',
            tone: 'neutral',
          },
        ]
      }

      case 'inventario': {
        const data = inventarioQuery.data ?? []
        const byStatus = data.reduce<Record<string, number>>((acc, row) => {
          const key = row.estado_dispositivo_nombre ?? `ID ${row.estado_dispositivo_id}`
          acc[key] = (acc[key] ?? 0) + 1
          return acc
        }, {})
        const topStatus = Object.entries(byStatus).sort((a, b) => b[1] - a[1])[0]
        return [
          { label: 'Dispositivos', value: String(data.length), tone: 'emerald' },
          { label: 'Estados', value: String(Object.keys(byStatus).length), tone: 'teal' },
          {
            label: 'Tipos',
            value: String(new Set(data.map((x) => x.tipo_dispositivo)).size),
            tone: 'amber',
          },
          {
            label: 'Estado principal',
            value: topStatus?.[0] ?? '—',
            helper: topStatus ? `${topStatus[1]} equipos` : 'Sin datos',
            tone: 'neutral',
          },
        ]
      }

      case 'riego': {
        const data = riegoQuery.data ?? []
        const durations = data.map((r) => r.duracion_segundos ?? 0)
        const totalDuration = durations.reduce((a, b) => a + b, 0)
        const avgDuration = data.length ? totalDuration / data.length : 0

        return [
          { label: 'Eventos', value: String(data.length), tone: 'emerald' },
          { label: 'Duración total s', value: formatDecimal(totalDuration), tone: 'teal' },
          { label: 'Duración promedio', value: formatDecimal(avgDuration), tone: 'amber' },
          {
            label: 'Invernaderos',
            value: String(new Set(data.map((x) => x.invernadero_id)).size),
            tone: 'neutral',
          },
        ]
      }

      case 'predicciones': {
        const data = prediccionesQuery.data ?? []
        const values = data.map((row) => Number(row.volumen_predicho_l)).filter((n) => !Number.isNaN(n))
        const total = values.reduce((a, b) => a + b, 0)
        const avg = values.length ? total / values.length : 0
        return [
          { label: 'Predicciones', value: String(data.length), tone: 'emerald' },
          { label: 'Volumen total L', value: formatDecimal(total), tone: 'teal' },
          { label: 'Volumen promedio', value: formatDecimal(avg), tone: 'amber' },
          {
            label: 'Modelos',
            value: String(new Set(data.map((x) => x.modelo_usado)).size),
            tone: 'neutral',
          },
        ]
      }

      default:
        return []
    }
  }, [
    activeReport,
    lecturasQuery.data,
    alertasQuery.data,
    inventarioQuery.data,
    riegoQuery.data,
    prediccionesQuery.data,
  ])

  const barChartData = useMemo<ChartDatum[]>(() => {
    switch (activeReport) {
      case 'lecturas':
        return groupChartData(lecturasQuery.data ?? [], (row) => row.sensor_nombre)
      case 'alertas':
        return groupChartData(alertasQuery.data ?? [], (row) => row.tipo_alerta)
      case 'inventario':
        return groupChartData(
          inventarioQuery.data ?? [],
          (row) => row.estado_dispositivo_nombre ?? `ID ${row.estado_dispositivo_id}`
        )
      case 'riego':
        return groupChartData(
          riegoQuery.data ?? [],
          (row) => row.invernadero_nombre ?? `ID ${row.invernadero_id}`
        )
      case 'predicciones':
        return groupChartData(prediccionesQuery.data ?? [], (row) => row.modelo_usado)
      default:
        return []
    }
  }, [
    activeReport,
    lecturasQuery.data,
    alertasQuery.data,
    inventarioQuery.data,
    riegoQuery.data,
    prediccionesQuery.data,
  ])

  const donaChartData = useMemo<ChartDatum[]>(() => {
    switch (activeReport) {
      case 'lecturas':
        return groupChartData(lecturasQuery.data ?? [], (row) => row.sensor_nombre)
      case 'alertas':
        return groupChartData(alertasQuery.data ?? [], (row) => row.tipo_alerta)
      case 'inventario':
        return groupChartData(
          inventarioQuery.data ?? [],
          (row) => row.estado_dispositivo_nombre ?? `ID ${row.estado_dispositivo_id}`
        )
      case 'riego':
        return groupChartData(
          riegoQuery.data ?? [],
          (row) => row.invernadero_nombre ?? `ID ${row.invernadero_id}`
        )
      case 'predicciones':
        return groupChartData(prediccionesQuery.data ?? [], (row) => row.modelo_usado)
      default:
        return []
    }
  }, [
    activeReport,
    lecturasQuery.data,
    alertasQuery.data,
    inventarioQuery.data,
    riegoQuery.data,
    prediccionesQuery.data,
  ])

  async function getAllRowsForExport(): Promise<Record<string, string | number>[]> {
    switch (activeReport) {
      case 'lecturas': {
        const rows = await reportesService.getLecturasSensorAll(stripPagination(lecturasApplied))
        return rows.map((r) => ({
          'Código sensor': r.sensor_codigo,
          Sensor: r.sensor_nombre,
          Valor: r.lectura_valor,
          'Fecha lectura': formatDateTime(r.fecha_lectura),
        }))
      }
      case 'alertas': {
        const rows = await reportesService.getAlertasInvernaderoAll(stripPagination(alertasApplied))
        return rows.map((r) => ({
          'Tipo alerta': r.tipo_alerta,
          Mensaje: r.mensaje,
          Invernadero: r.invernadero_nombre ?? `ID ${r.invernadero_id}`,
          'Fecha generación': formatDateTime(r.fecha_generacion),
        }))
      }
      case 'inventario': {
        const rows = await reportesService.getInventarioDispositivosAll(stripPagination(inventarioApplied))
        return rows.map((r) => ({
          Código: r.codigo,
          Dispositivo: r.nombre,
          'Tipo dispositivo': r.tipo_dispositivo,
          Estado: r.estado_dispositivo_nombre ?? `ID ${r.estado_dispositivo_id}`,
        }))
      }
      case 'riego': {
        const rows = await reportesService.getRiegoEjecutadoAll(stripPagination(riegoApplied))
        return rows.map((r) => ({
          Invernadero: r.invernadero_nombre ?? `ID ${r.invernadero_id}`,
          Decisión: r.texto_decision,
          'Inicio evento': formatDateTime(r.inicio_evento),
          'Duración s': r.duracion_segundos ?? '—',
        }))
      }
      case 'predicciones': {
        const rows = await reportesService.getPrediccionesAguaAll(stripPagination(prediccionesApplied))
        return rows.map((r) => ({
          'Fuente agua': r.fuente_agua,
          Modelo: r.modelo_usado,
          'Fecha objetivo': formatDate(r.fecha_objetivo),
          'Volumen predicho L': r.volumen_predicho_l,
        }))
      }
      default:
        return []
    }
  }

  const exportFileName = `reporte-${activeReport}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`

  async function handleExportCSV() {
    try {
      setIsExporting(true)
      const rows = await getAllRowsForExport()
      exportToCSV(rows, exportFileName)
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportExcel() {
    try {
      setIsExporting(true)
      const rows = await getAllRowsForExport()
      await exportToExcel(rows, exportFileName)
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportPDF() {
    try {
      setIsExporting(true)
      const rows = await getAllRowsForExport()
      exportToPDF(activeTitle, reportStats, rows, exportFileName)
    } finally {
      setIsExporting(false)
    }
  }

  async function handlePrintAll() {
    try {
      setIsExporting(true)
      const rows = await getAllRowsForExport()
      handlePrintPDF(activeTitle, reportStats, rows, exportFileName)
    } finally {
      setIsExporting(false)
    }
  }

  const lecturasColumns: Column<VReporteLecturasSensor>[] = [
    { key: 'sensor_codigo', label: 'Código sensor' },
    { key: 'sensor_nombre', label: 'Sensor' },
    { key: 'lectura_valor', label: 'Valor', render: (value) => formatDecimal(value) },
    { key: 'fecha_lectura', label: 'Fecha lectura', render: (value) => formatDateTime(value) },
  ]

  const alertasColumns: Column<VReporteAlertasInvernadero>[] = [
    { key: 'tipo_alerta', label: 'Tipo alerta', render: (value) => <StatusBadge label={String(value)} /> },
    { key: 'mensaje', label: 'Mensaje' },
    {
      key: 'invernadero_nombre',
      label: 'Invernadero',
      render: (value, row) => value ?? `ID ${row.invernadero_id}`,
    },
    { key: 'fecha_generacion', label: 'Fecha generación', render: (value) => formatDateTime(value) },
  ]

  const inventarioColumns: Column<VReporteInventarioDispositivos>[] = [
    { key: 'codigo', label: 'Código', className: 'font-medium' },
    { key: 'nombre', label: 'Dispositivo' },
    { key: 'tipo_dispositivo', label: 'Tipo dispositivo' },
    {
      key: 'estado_dispositivo_nombre',
      label: 'Estado',
      render: (value) => <StatusBadge label={String(value ?? 'Desconocido')} />,
    },
  ]

  const riegoColumns: Column<VReporteRiegoEjecutado>[] = [
    {
      key: 'invernadero_nombre',
      label: 'Invernadero',
      render: (value, row) => value ?? `ID ${row.invernadero_id}`,
    },
    { key: 'texto_decision', label: 'Decisión' },
    { key: 'inicio_evento', label: 'Inicio evento', render: (value) => formatDateTime(value) },
    {
      key: 'duracion_segundos',
      label: 'Duración s',
      render: (value) => (value != null ? formatDecimal(value) : '—'),
    },
  ]

  const prediccionesColumns: Column<VReportePrediccionesAgua>[] = [
    { key: 'fuente_agua', label: 'Fuente agua' },
    { key: 'modelo_usado', label: 'Modelo' },
    { key: 'fecha_objetivo', label: 'Fecha objetivo', render: (value) => formatDate(value) },
    {
      key: 'volumen_predicho_l',
      label: 'Volumen predicho L',
      render: (value) => formatDecimal(value),
    },
  ]

  function renderSearchValue() {
    if (activeReport === 'lecturas') return lecturasDraft.q
    if (activeReport === 'alertas') return alertasDraft.q
    if (activeReport === 'inventario') return inventarioDraft.q
    if (activeReport === 'riego') return riegoDraft.q
    return prediccionesDraft.q
  }

  function updateSearchValue(value: string) {
    if (activeReport === 'lecturas') setLecturasDraft((prev) => ({ ...prev, q: value }))
    if (activeReport === 'alertas') setAlertasDraft((prev) => ({ ...prev, q: value }))
    if (activeReport === 'inventario') setInventarioDraft((prev) => ({ ...prev, q: value }))
    if (activeReport === 'riego') setRiegoDraft((prev) => ({ ...prev, q: value }))
    if (activeReport === 'predicciones') setPrediccionesDraft((prev) => ({ ...prev, q: value }))
  }

  function renderFilters() {
    switch (activeReport) {
      case 'lecturas':
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <InputField
              id="sensor_codigo"
              label="Código sensor"
              value={lecturasDraft.sensor_codigo}
              onChange={(value) => setLecturasDraft((prev) => ({ ...prev, sensor_codigo: value }))}
            />
            <InputField
              id="sensor_nombre"
              label="Nombre sensor"
              value={lecturasDraft.sensor_nombre}
              onChange={(value) => setLecturasDraft((prev) => ({ ...prev, sensor_nombre: value }))}
            />
            <InputField
              id="lecturas_fecha_desde"
              label="Fecha desde"
              type="datetime-local"
              value={lecturasDraft.fecha_desde}
              onChange={(value) => setLecturasDraft((prev) => ({ ...prev, fecha_desde: value }))}
            />
            <InputField
              id="lecturas_fecha_hasta"
              label="Fecha hasta"
              type="datetime-local"
              value={lecturasDraft.fecha_hasta}
              onChange={(value) => setLecturasDraft((prev) => ({ ...prev, fecha_hasta: value }))}
            />
            <SelectField
              id="lecturas_limit"
              label="Registros por página"
              value={lecturasDraft.limit}
              onChange={(value) => setLecturasDraft((prev) => ({ ...prev, limit: value }))}
              options={limitOptions.map((value) => ({ value, label: String(value) }))}
            />
          </div>
        )

      case 'alertas':
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <InputField
              id="tipo_alerta"
              label="Tipo alerta"
              value={alertasDraft.tipo_alerta}
              onChange={(value) => setAlertasDraft((prev) => ({ ...prev, tipo_alerta: value }))}
            />
            <InputField
              id="mensaje"
              label="Mensaje"
              value={alertasDraft.mensaje}
              onChange={(value) => setAlertasDraft((prev) => ({ ...prev, mensaje: value }))}
            />
            <InputField
              id="invernadero_id_alerta"
              label="Invernadero ID"
              type="number"
              value={alertasDraft.invernadero_id}
              onChange={(value) => setAlertasDraft((prev) => ({ ...prev, invernadero_id: value }))}
            />
            <InputField
              id="alertas_fecha_desde"
              label="Fecha desde"
              type="datetime-local"
              value={alertasDraft.fecha_desde}
              onChange={(value) => setAlertasDraft((prev) => ({ ...prev, fecha_desde: value }))}
            />
            <InputField
              id="alertas_fecha_hasta"
              label="Fecha hasta"
              type="datetime-local"
              value={alertasDraft.fecha_hasta}
              onChange={(value) => setAlertasDraft((prev) => ({ ...prev, fecha_hasta: value }))}
            />
            <SelectField
              id="alertas_limit"
              label="Registros por página"
              value={alertasDraft.limit}
              onChange={(value) => setAlertasDraft((prev) => ({ ...prev, limit: value }))}
              options={limitOptions.map((value) => ({ value, label: String(value) }))}
            />
          </div>
        )

      case 'inventario':
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <InputField
              id="inventario_codigo"
              label="Código"
              value={inventarioDraft.codigo}
              onChange={(value) => setInventarioDraft((prev) => ({ ...prev, codigo: value }))}
            />
            <InputField
              id="inventario_nombre"
              label="Nombre"
              value={inventarioDraft.nombre}
              onChange={(value) => setInventarioDraft((prev) => ({ ...prev, nombre: value }))}
            />
            <InputField
              id="tipo_dispositivo"
              label="Tipo dispositivo"
              value={inventarioDraft.tipo_dispositivo}
              onChange={(value) => setInventarioDraft((prev) => ({ ...prev, tipo_dispositivo: value }))}
            />
            <div className="space-y-2">
              <Label>Estado del dispositivo</Label>
              <Select
                value={inventarioDraft.estado_dispositivo_id?.toString() ?? 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setInventarioDraft((prev) => ({ ...prev, estado_dispositivo_id: '' }))
                  } else {
                    setInventarioDraft((prev) => ({ ...prev, estado_dispositivo_id: value }))
                  }
                }}
              >
                <SelectTrigger className="rounded-2xl border-border/70 bg-background">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {allEstadosOptions.map((estado) => (
                    <SelectItem key={estado.id} value={String(estado.id)}>
                      {estado.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SelectField
              id="inventario_limit"
              label="Registros por página"
              value={inventarioDraft.limit}
              onChange={(value) => setInventarioDraft((prev) => ({ ...prev, limit: value }))}
              options={limitOptions.map((value) => ({ value, label: String(value) }))}
            />
          </div>
        )

      case 'riego':
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <InputField
              id="riego_invernadero_id"
              label="Invernadero ID"
              type="number"
              value={riegoDraft.invernadero_id}
              onChange={(value) => setRiegoDraft((prev) => ({ ...prev, invernadero_id: value }))}
            />
            <InputField
              id="texto_decision"
              label="Decisión"
              value={riegoDraft.texto_decision}
              onChange={(value) => setRiegoDraft((prev) => ({ ...prev, texto_decision: value }))}
            />
            <InputField
              id="riego_fecha_desde"
              label="Fecha desde"
              type="datetime-local"
              value={riegoDraft.fecha_desde}
              onChange={(value) => setRiegoDraft((prev) => ({ ...prev, fecha_desde: value }))}
            />
            <InputField
              id="riego_fecha_hasta"
              label="Fecha hasta"
              type="datetime-local"
              value={riegoDraft.fecha_hasta}
              onChange={(value) => setRiegoDraft((prev) => ({ ...prev, fecha_hasta: value }))}
            />
            <SelectField
              id="riego_limit"
              label="Registros por página"
              value={riegoDraft.limit}
              onChange={(value) => setRiegoDraft((prev) => ({ ...prev, limit: value }))}
              options={limitOptions.map((value) => ({ value, label: String(value) }))}
            />
          </div>
        )

      case 'predicciones':
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <InputField
              id="fuente_agua"
              label="Fuente agua"
              value={prediccionesDraft.fuente_agua}
              onChange={(value) => setPrediccionesDraft((prev) => ({ ...prev, fuente_agua: value }))}
            />
            <InputField
              id="modelo_usado"
              label="Modelo"
              value={prediccionesDraft.modelo_usado}
              onChange={(value) => setPrediccionesDraft((prev) => ({ ...prev, modelo_usado: value }))}
            />
            <InputField
              id="predicciones_fecha_desde"
              label="Fecha desde"
              type="date"
              value={prediccionesDraft.fecha_desde}
              onChange={(value) => setPrediccionesDraft((prev) => ({ ...prev, fecha_desde: value }))}
            />
            <InputField
              id="predicciones_fecha_hasta"
              label="Fecha hasta"
              type="date"
              value={prediccionesDraft.fecha_hasta}
              onChange={(value) => setPrediccionesDraft((prev) => ({ ...prev, fecha_hasta: value }))}
            />
            <SelectField
              id="predicciones_limit"
              label="Registros por página"
              value={prediccionesDraft.limit}
              onChange={(value) => setPrediccionesDraft((prev) => ({ ...prev, limit: value }))}
              options={limitOptions.map((value) => ({ value, label: String(value) }))}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-full space-y-6 bg-background">
      {/* HEADER */}
      <section className="rounded-[28px] border border-border/70 bg-card px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
            >
              Reportería
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Reportes de vistas
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Consulta métricas, revisa tendencias y exporta resultados desde una vista unificada para operación y análisis.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" className="rounded-2xl" onClick={() => currentQuery.refetch()} disabled={currentQuery.isFetching || isExporting}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {currentQuery.isFetching ? 'Recargando...' : 'Recargar'}
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={handleExportCSV} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleExportExcel} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={handleExportPDF} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={handlePrintAll} disabled={isExporting}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 border-b border-border/70 pb-4 print:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeReport === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveReport(tab.id)}
              className={[
                'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-emerald-600 text-white'
                  : 'border border-border/70 bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ESTADÍSTICAS */}
      <StatsCards stats={reportStats} />

      {/* GRÁFICOS EN DISPOSICIÓN HORIZONTAL (2 columnas) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <BarChartPanel title={`Distribución por categoría - ${activeTitle}`} chartData={barChartData} />
        <DonaChartPanel title={`Distribución porcentual - ${activeTitle}`} data={donaChartData} />
      </div>

      {/* BÚSQUEDA Y ACCIONES */}
      <SurfaceCard
        title="Búsqueda y acciones"
        description="Busca en tiempo real y exporta los datos actuales."
        action={<Badge variant="outline" className="rounded-full">{currentData.length} registros</Badge>}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={renderSearchValue()}
              onChange={(e) => updateSearchValue(e.target.value)}
              placeholder="Buscar en tiempo real..."
              className="h-11 rounded-2xl border-border/70 bg-background pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => currentQuery.refetch()} disabled={currentQuery.isFetching || isExporting}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={handleExportCSV} disabled={isExporting}>
              CSV
            </Button>
            <Button className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleExportExcel} disabled={isExporting}>
              Excel
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={handleExportPDF} disabled={isExporting}>
              PDF
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={handlePrintAll} disabled={isExporting}>
              Imprimir
            </Button>
          </div>
        </div>
      </SurfaceCard>

      {/* FILTROS ADICIONALES */}
      <SurfaceCard
        title={`Filtros adicionales · ${activeTitle}`}
        description="Refina los resultados con criterios específicos."
        action={
          <Button variant="outline" className="rounded-2xl" onClick={handleResetFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Limpiar filtros
          </Button>
        }
      >
        {renderFilters()}
      </SurfaceCard>

      {/* ERRORES Y EXPORTACIÓN */}
      {currentQuery.isError && (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
          Ocurrió un error al cargar la información del reporte.
        </div>
      )}

      {isExporting && (
        <div className="rounded-[24px] border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-700 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300">
          Preparando exportación completa con los filtros aplicados...
        </div>
      )}

      {/* TABLA DE RESULTADOS */}
      {currentQuery.isLoading ? (
        <SurfaceCard title="Resultados" description="Cargando información del reporte seleccionado.">
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-emerald-600" />
            <p className="text-sm text-muted-foreground">Cargando información...</p>
          </div>
        </SurfaceCard>
      ) : (
        <div className="space-y-4">
          {currentQuery.isFetching && !currentQuery.isLoading && (
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
              Actualizando resultados...
            </div>
          )}

          <SurfaceCard
            title={`Resultados · ${activeTitle}`}
            description="Vista tabular del reporte actual con los filtros aplicados."
            action={
              <Badge variant="outline" className="rounded-full">
                <Database className="mr-2 h-3.5 w-3.5" />
                {rowsLoaded} filas visibles
              </Badge>
            }
          >
            {activeReport === 'lecturas' && (
              <ReportTable
                data={lecturasQuery.data ?? []}
                columns={lecturasColumns}
                emptyMessage="No se encontraron lecturas para los filtros aplicados."
                getRowKey={(row) => row.lectura_id}
              />
            )}
            {activeReport === 'alertas' && (
              <ReportTable
                data={alertasQuery.data ?? []}
                columns={alertasColumns}
                emptyMessage="No se encontraron alertas para los filtros aplicados."
                getRowKey={(row) => row.alerta_id}
              />
            )}
            {activeReport === 'inventario' && (
              <ReportTable
                data={inventarioQuery.data ?? []}
                columns={inventarioColumns}
                emptyMessage="No se encontraron dispositivos para los filtros aplicados."
                getRowKey={(row) => row.dispositivo_id}
              />
            )}
            {activeReport === 'riego' && (
              <ReportTable
                data={riegoQuery.data ?? []}
                columns={riegoColumns}
                emptyMessage="No se encontraron eventos de riego para los filtros aplicados."
                getRowKey={(row) => row.decision_id}
              />
            )}
            {activeReport === 'predicciones' && (
              <ReportTable
                data={prediccionesQuery.data ?? []}
                columns={prediccionesColumns}
                emptyMessage="No se encontraron predicciones para los filtros aplicados."
                getRowKey={(row) => row.prediccion_id}
              />
            )}
          </SurfaceCard>

          {/* PAGINACIÓN */}
          {!currentQuery.isError && (
            <PaginationControls
              page={currentPage}
              limit={currentLimit}
              rowsLoaded={rowsLoaded}
              onFirst={handleFirstPage}
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default ReportesVistasPage