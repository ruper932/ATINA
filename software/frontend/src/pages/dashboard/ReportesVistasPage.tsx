import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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
} from 'recharts'

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

const panelClass =
  'rounded-2xl border border-white/60 bg-white/80 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/75 dark:shadow-none'

function toParams<T extends object>(filters: T): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  ) as Record<string, string | number>
}

function stripPagination<T extends { skip?: number; limit?: number }>(filters: T) {
  const { skip, limit, ...rest } = filters
  return rest
}

function formatDateTime(value: unknown) {
  if (typeof value !== 'string') return value != null ? String(value) : '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatDate(value: unknown) {
  if (typeof value !== 'string') return value != null ? String(value) : '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function formatDecimal(value: unknown) {
  const num = Number(value)
  if (Number.isNaN(num)) return value != null ? String(value) : '-'
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
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

function ReportTable<T extends object>({
  data,
  columns,
  emptyMessage,
  getRowKey,
}: ReportTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200/80 bg-white/80 px-6 text-center shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <p className="text-sm text-stone-500 dark:text-zinc-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={panelClass}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200/70 bg-stone-100/70 dark:border-zinc-800 dark:bg-zinc-800/70">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-600 dark:text-zinc-300"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100/80 dark:divide-zinc-800">
            {data.map((row, rowIndex) => (
              <tr
                key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}
                className="transition hover:bg-emerald-50/50 dark:hover:bg-zinc-800/50"
              >
                {columns.map((column) => {
                  const value = row[column.key]
                  return (
                    <td
                      key={String(column.key)}
                      className={`px-4 py-3 align-middle text-stone-700 dark:text-zinc-200 ${column.className ?? ''}`}
                    >
                      {column.render
                        ? column.render(value, row)
                        : value !== null && value !== undefined
                          ? String(value)
                          : '-'}
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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-stone-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-stone-200/80 bg-white/80 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-stone-700 dark:text-zinc-300">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-stone-200/80 bg-white/80 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-100"
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
  const style =
    lower.includes('activo') || lower.includes('stock') || lower.includes('ok')
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
      : lower.includes('inactivo') || lower.includes('crit') || lower.includes('out')
        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
        : lower.includes('bajo') || lower.includes('warn') || lower.includes('low')
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
          : 'bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400'

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  )
}

function StatsCards({ stats }: { stats: StatCard[] }) {
  const toneMap = {
    emerald: 'border-emerald-200/80 dark:border-emerald-900/30',
    teal: 'border-teal-200/80 dark:border-teal-900/30',
    amber: 'border-amber-200/80 dark:border-amber-900/30',
    rose: 'border-rose-200/80 dark:border-rose-900/30',
    neutral: 'border-stone-200/80 dark:border-zinc-800',
  }

  const accentMap = {
    emerald: 'text-emerald-700 dark:text-emerald-400',
    teal: 'text-teal-700 dark:text-teal-400',
    amber: 'text-amber-700 dark:text-amber-400',
    rose: 'text-rose-700 dark:text-rose-400',
    neutral: 'text-stone-900 dark:text-white',
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-2xl border bg-white/80 p-5 shadow-[0_10px_25px_-15px_rgba(15,23,42,0.25)] backdrop-blur dark:bg-zinc-900/80 ${toneMap[stat.tone ?? 'neutral']}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-zinc-400">
            {stat.label}
          </p>
          <p className={`mt-3 text-3xl font-black tracking-tight ${accentMap[stat.tone ?? 'neutral']}`}>
            {stat.value}
          </p>
          {stat.helper && (
            <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">{stat.helper}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function AnalyticsPanel({
  title,
  chartData,
}: {
  title: string
  chartData: ChartDatum[]
}) {
  const colors = ['#059669', '#0f766e', '#14b8a6', '#84cc16', '#d97706', '#e11d48', '#78716c']

  if (!chartData.length) return null

  return (
    <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
      <div className={`${panelClass} p-4`}>
        <h3 className="mb-4 text-sm font-bold text-stone-900 dark:text-white">{title}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.22} />
              <XAxis dataKey="name" stroke="#78716c" />
              <YAxis allowDecimals={false} stroke="#78716c" />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #d6d3d1',
                  backgroundColor: '#ffffff',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#059669" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${panelClass} p-4`}>
        <h3 className="mb-4 text-sm font-bold text-stone-900 dark:text-white">Distribución</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={92} label>
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #d6d3d1',
                  backgroundColor: '#ffffff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
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
    <div className={`${panelClass} flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between`}>
      <div>
        <p className="text-sm font-medium text-stone-700 dark:text-zinc-200">
          Mostrando {start}–{end}
        </p>
        <p className="text-xs text-stone-500 dark:text-zinc-400">Página {page}</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onFirst}
          disabled={!hasPrevious}
          className="rounded-lg border border-stone-200/80 bg-white/80 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {'<<'}
        </button>
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="rounded-lg border border-stone-200/80 bg-white/80 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {'<'}
        </button>
        <div className="mx-2 min-w-[96px] rounded-lg bg-stone-100/80 px-3 py-1.5 text-center text-sm font-medium text-stone-700 dark:bg-zinc-800 dark:text-zinc-200">
          {page}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="rounded-lg border border-stone-200/80 bg-white/80 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {'>'}
        </button>
      </div>
    </div>
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

function exportToCSV(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const escapeCell = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header] ?? '')).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportToExcel(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')
  XLSX.writeFile(workbook, `${filename}.xlsx`)
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
    headStyles: { fillColor: [5, 150, 105] },
    margin: { left: 14, right: 14 },
  })

  doc.save(`${filename}.pdf`)
}

function handlePrintPDF(
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
    headStyles: { fillColor: [5, 150, 105] },
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

  const tabs = [
    { id: 'lecturas', label: 'Lecturas por sensor' },
    { id: 'alertas', label: 'Alertas por invernadero' },
    { id: 'inventario', label: 'Inventario dispositivos' },
    { id: 'riego', label: 'Riego ejecutado' },
    { id: 'predicciones', label: 'Predicciones de agua' },
  ] as const

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

  const currentQuery = {
    lecturas: lecturasQuery,
    alertas: alertasQuery,
    inventario: inventarioQuery,
    riego: riegoQuery,
    predicciones: prediccionesQuery,
  }[activeReport]

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault()

    switch (activeReport) {
      case 'lecturas':
        setLecturasApplied({ ...lecturasDraft, skip: 0 })
        break
      case 'alertas':
        setAlertasApplied({ ...alertasDraft, skip: 0 })
        break
      case 'inventario':
        setInventarioApplied({ ...inventarioDraft, skip: 0 })
        break
      case 'riego':
        setRiegoApplied({ ...riegoDraft, skip: 0 })
        break
      case 'predicciones':
        setPrediccionesApplied({ ...prediccionesDraft, skip: 0 })
        break
    }
  }

  function handleResetFilters() {
    switch (activeReport) {
      case 'lecturas':
        setLecturasDraft(initialLecturasFilters)
        setLecturasApplied(initialLecturasFilters)
        break
      case 'alertas':
        setAlertasDraft(initialAlertasFilters)
        setAlertasApplied(initialAlertasFilters)
        break
      case 'inventario':
        setInventarioDraft(initialInventarioFilters)
        setInventarioApplied(initialInventarioFilters)
        break
      case 'riego':
        setRiegoDraft(initialRiegoFilters)
        setRiegoApplied(initialRiegoFilters)
        break
      case 'predicciones':
        setPrediccionesDraft(initialPrediccionesFilters)
        setPrediccionesApplied(initialPrediccionesFilters)
        break
    }
  }

  const currentData = currentQuery.data ?? []
  const currentAppliedFilters = {
    lecturas: lecturasApplied,
    alertas: alertasApplied,
    inventario: inventarioApplied,
    riego: riegoApplied,
    predicciones: prediccionesApplied,
  }[activeReport]

  const currentPage = Math.floor(currentAppliedFilters.skip / currentAppliedFilters.limit) + 1
  const currentLimit = currentAppliedFilters.limit
  const rowsLoaded = currentData.length
  const hasPrevious = currentAppliedFilters.skip > 0
  const hasNext = rowsLoaded === currentLimit

  function updateSkipForPage(nextPage: number) {
    const nextSkip = (nextPage - 1) * currentLimit

    switch (activeReport) {
      case 'lecturas':
        setLecturasApplied((prev) => ({ ...prev, skip: nextSkip }))
        break
      case 'alertas':
        setAlertasApplied((prev) => ({ ...prev, skip: nextSkip }))
        break
      case 'inventario':
        setInventarioApplied((prev) => ({ ...prev, skip: nextSkip }))
        break
      case 'riego':
        setRiegoApplied((prev) => ({ ...prev, skip: nextSkip }))
        break
      case 'predicciones':
        setPrediccionesApplied((prev) => ({ ...prev, skip: nextSkip }))
        break
    }
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
        const last = data[0]?.fecha_lectura ?? null

        return [
          { label: 'Lecturas', value: String(data.length), tone: 'emerald' },
          { label: 'Promedio', value: formatDecimal(avg), tone: 'teal' },
          { label: 'Mínimo', value: formatDecimal(min), tone: 'amber' },
          {
            label: 'Máximo',
            value: formatDecimal(max),
            helper: last ? `Última: ${formatDateTime(last)}` : undefined,
            tone: 'neutral',
          },
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
          { label: 'Invernaderos', value: String(new Set(data.map((x) => x.invernadero_id)).size), tone: 'teal' },
          {
            label: 'Tipo principal',
            value: topType?.[0] ?? '-',
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
          { label: 'Tipos', value: String(new Set(data.map((x) => x.tipo_dispositivo)).size), tone: 'amber' },
          {
            label: 'Estado principal',
            value: topStatus?.[0] ?? '-',
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
          { label: 'Duración total (s)', value: formatDecimal(totalDuration), tone: 'teal' },
          { label: 'Duración promedio', value: formatDecimal(avgDuration), tone: 'amber' },
          { label: 'Invernaderos', value: String(new Set(data.map((x) => x.invernadero_id)).size), tone: 'neutral' },
        ]
      }

      case 'predicciones': {
        const data = prediccionesQuery.data ?? []
        const values = data.map((row) => Number(row.volumen_predicho_l)).filter((n) => !Number.isNaN(n))
        const total = values.reduce((a, b) => a + b, 0)
        const avg = values.length ? total / values.length : 0

        return [
          { label: 'Predicciones', value: String(data.length), tone: 'emerald' },
          { label: 'Volumen total (L)', value: formatDecimal(total), tone: 'teal' },
          { label: 'Volumen promedio', value: formatDecimal(avg), tone: 'amber' },
          { label: 'Modelos', value: String(new Set(data.map((x) => x.modelo_usado)).size), tone: 'neutral' },
        ]
      }

      default:
        return []
    }
  }, [activeReport, lecturasQuery.data, alertasQuery.data, inventarioQuery.data, riegoQuery.data, prediccionesQuery.data])

  const chartData = useMemo<ChartDatum[]>(() => {
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
  }, [activeReport, lecturasQuery.data, alertasQuery.data, inventarioQuery.data, riegoQuery.data, prediccionesQuery.data])

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
          'Duración (s)': r.duracion_segundos ?? '-',
        }))
      }

      case 'predicciones': {
        const rows = await reportesService.getPrediccionesAguaAll(stripPagination(prediccionesApplied))
        return rows.map((r) => ({
          'Fuente agua': r.fuente_agua,
          Modelo: r.modelo_usado,
          'Fecha objetivo': formatDate(r.fecha_objetivo),
          'Volumen predicho (L)': r.volumen_predicho_l,
        }))
      }

      default:
        return []
    }
  }

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
      exportToExcel(rows, exportFileName)
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

  const exportFileName = `reporte-${activeReport}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`

  const lecturasColumns: Column<VReporteLecturasSensor>[] = [
    { key: 'sensor_codigo', label: 'Código sensor' },
    { key: 'sensor_nombre', label: 'Sensor' },
    {
      key: 'lectura_valor',
      label: 'Valor',
      render: (value) => formatDecimal(value),
    },
    {
      key: 'fecha_lectura',
      label: 'Fecha lectura',
      render: (value) => formatDateTime(value),
    },
  ]

  const alertasColumns: Column<VReporteAlertasInvernadero>[] = [
    {
      key: 'tipo_alerta',
      label: 'Tipo alerta',
      render: (value) => <StatusBadge label={String(value)} />,
    },
    { key: 'mensaje', label: 'Mensaje' },
    {
      key: 'invernadero_nombre',
      label: 'Invernadero',
      render: (value, row) => value ?? `ID ${row.invernadero_id}`,
    },
    {
      key: 'fecha_generacion',
      label: 'Fecha generación',
      render: (value) => formatDateTime(value),
    },
  ]

  const inventarioColumns: Column<VReporteInventarioDispositivos>[] = [
    { key: 'codigo', label: 'Código', className: 'font-semibold text-stone-900 dark:text-zinc-100' },
    { key: 'nombre', label: 'Dispositivo' },
    { key: 'tipo_dispositivo', label: 'Tipo dispositivo' },
    {
      key: 'estado_dispositivo_nombre',
      label: 'Estado',
      render: (value, row) => (
        <StatusBadge label={String(value ?? `ID ${row.estado_dispositivo_id}`)} />
      ),
    },
  ]

  const riegoColumns: Column<VReporteRiegoEjecutado>[] = [
    {
      key: 'invernadero_nombre',
      label: 'Invernadero',
      render: (value, row) => value ?? `ID ${row.invernadero_id}`,
    },
    { key: 'texto_decision', label: 'Decisión' },
    {
      key: 'inicio_evento',
      label: 'Inicio evento',
      render: (value) => formatDateTime(value),
    },
    {
      key: 'duracion_segundos',
      label: 'Duración (s)',
      render: (value) => (value !== null ? formatDecimal(value) : '-'),
    },
  ]

  const prediccionesColumns: Column<VReportePrediccionesAgua>[] = [
    { key: 'fuente_agua', label: 'Fuente agua' },
    { key: 'modelo_usado', label: 'Modelo' },
    {
      key: 'fecha_objetivo',
      label: 'Fecha objetivo',
      render: (value) => formatDate(value),
    },
    {
      key: 'volumen_predicho_l',
      label: 'Volumen predicho (L)',
      render: (value) => formatDecimal(value),
    },
  ]

  const limitOptions = [
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
  ]

  const renderFilters = () => {
    switch (activeReport) {
      case 'lecturas':
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InputField
              id="lecturas_q"
              label="Búsqueda"
              value={lecturasDraft.q}
              onChange={(value) => setLecturasDraft((prev) => ({ ...prev, q: value }))}
              placeholder="Código o nombre..."
            />
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
            <SelectField
              id="lecturas_limit"
              label="Registros por página"
              value={lecturasDraft.limit}
              onChange={(value) => setLecturasDraft((prev) => ({ ...prev, limit: value }))}
              options={limitOptions}
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
          </div>
        )

      case 'alertas':
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InputField
              id="alertas_q"
              label="Búsqueda"
              value={alertasDraft.q}
              onChange={(value) => setAlertasDraft((prev) => ({ ...prev, q: value }))}
              placeholder="Tipo o mensaje..."
            />
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
              options={limitOptions}
            />
          </div>
        )

      case 'inventario':
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InputField
              id="inventario_q"
              label="Búsqueda"
              value={inventarioDraft.q}
              onChange={(value) => setInventarioDraft((prev) => ({ ...prev, q: value }))}
              placeholder="Código, nombre o tipo..."
            />
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
              onChange={(value) =>
                setInventarioDraft((prev) => ({ ...prev, tipo_dispositivo: value }))
              }
            />
            <InputField
              id="estado_dispositivo_id"
              label="Estado ID"
              type="number"
              value={inventarioDraft.estado_dispositivo_id}
              onChange={(value) =>
                setInventarioDraft((prev) => ({ ...prev, estado_dispositivo_id: value }))
              }
            />
            <SelectField
              id="inventario_limit"
              label="Registros por página"
              value={inventarioDraft.limit}
              onChange={(value) => setInventarioDraft((prev) => ({ ...prev, limit: value }))}
              options={limitOptions}
            />
          </div>
        )

      case 'riego':
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InputField
              id="riego_q"
              label="Búsqueda"
              value={riegoDraft.q}
              onChange={(value) => setRiegoDraft((prev) => ({ ...prev, q: value }))}
              placeholder="Texto decisión..."
            />
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
            <SelectField
              id="riego_limit"
              label="Registros por página"
              value={riegoDraft.limit}
              onChange={(value) => setRiegoDraft((prev) => ({ ...prev, limit: value }))}
              options={limitOptions}
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
          </div>
        )

      case 'predicciones':
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InputField
              id="predicciones_q"
              label="Búsqueda"
              value={prediccionesDraft.q}
              onChange={(value) => setPrediccionesDraft((prev) => ({ ...prev, q: value }))}
              placeholder="Fuente o modelo..."
            />
            <InputField
              id="fuente_agua"
              label="Fuente agua"
              value={prediccionesDraft.fuente_agua}
              onChange={(value) =>
                setPrediccionesDraft((prev) => ({ ...prev, fuente_agua: value }))
              }
            />
            <InputField
              id="modelo_usado"
              label="Modelo"
              value={prediccionesDraft.modelo_usado}
              onChange={(value) =>
                setPrediccionesDraft((prev) => ({ ...prev, modelo_usado: value }))
              }
            />
            <InputField
              id="predicciones_fecha_desde"
              label="Fecha desde"
              type="date"
              value={prediccionesDraft.fecha_desde}
              onChange={(value) =>
                setPrediccionesDraft((prev) => ({ ...prev, fecha_desde: value }))
              }
            />
            <InputField
              id="predicciones_fecha_hasta"
              label="Fecha hasta"
              type="date"
              value={prediccionesDraft.fecha_hasta}
              onChange={(value) =>
                setPrediccionesDraft((prev) => ({ ...prev, fecha_hasta: value }))
              }
            />
            <SelectField
              id="predicciones_limit"
              label="Registros por página"
              value={prediccionesDraft.limit}
              onChange={(value) => setPrediccionesDraft((prev) => ({ ...prev, limit: value }))}
              options={limitOptions}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.10),_transparent_24%)] px-4 py-6 md:px-8 md:py-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.10),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.08),_transparent_20%)]">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="relative overflow-hidden rounded-[28px] border border-emerald-100/70 bg-gradient-to-br from-white via-emerald-50/70 to-teal-50/60 p-6 shadow-[0_18px_50px_-24px_rgba(16,185,129,0.35)] dark:border-emerald-900/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(20,184,166,0.14),_transparent_24%)]" />
          <div className="relative">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 backdrop-blur dark:border-emerald-900/40 dark:bg-zinc-900/60 dark:text-emerald-300">
                  Panel administrativo
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-stone-900 dark:text-white md:text-5xl">
                  Reportes de vistas
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 dark:text-zinc-300 md:text-base">
                  Consulta métricas, revisa tendencias y exporta resultados desde una vista unificada para operación y análisis.
                </p>
              </div>

              <div className="grid gap-2 print:hidden sm:grid-cols-2 xl:min-w-[620px] xl:grid-cols-5">
                <button
                  type="button"
                  onClick={() => currentQuery.refetch()}
                  disabled={currentQuery.isFetching || isExporting}
                  className="rounded-xl border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {currentQuery.isFetching ? 'Recargando...' : 'Recargar'}
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="rounded-xl border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-zinc-800/80 dark:text-zinc-200"
                >
                  {isExporting ? 'Exportando...' : 'CSV'}
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_-10px_rgba(5,150,105,0.8)] transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isExporting ? 'Exportando...' : 'Excel'}
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_-10px_rgba(13,148,136,0.8)] transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:opacity-50"
                >
                  {isExporting ? 'Exportando...' : 'PDF'}
                </button>
                <button
                  type="button"
                  onClick={handlePrintAll}
                  disabled={isExporting}
                  className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-stone-800 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                >
                  {isExporting ? 'Preparando...' : 'Imprimir'}
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-emerald-100/70 pt-5 print:hidden dark:border-zinc-800">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveReport(tab.id)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    activeReport === tab.id
                      ? 'bg-stone-900 text-white shadow-sm dark:bg-emerald-600'
                      : 'border border-white/70 bg-white/70 text-stone-600 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleApplyFilters} className={`${panelClass} space-y-5 p-5 print:hidden`}>
          <div className="flex flex-col gap-2 border-b border-stone-200/70 pb-3 dark:border-zinc-800">
            <h2 className="text-base font-bold text-stone-900 dark:text-white">Filtros · {activeTitle}</h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Ajusta criterios, rango temporal y tamaño de página para refinar el reporte.
            </p>
          </div>

          {renderFilters()}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={currentQuery.isFetching || isExporting}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_-10px_rgba(5,150,105,0.8)] transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-50"
            >
              {currentQuery.isFetching ? 'Aplicando...' : 'Aplicar filtros'}
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={currentQuery.isFetching || isExporting}
              className="rounded-xl border border-stone-200/80 bg-white/80 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-white disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-200"
            >
              Limpiar filtros
            </button>
          </div>
        </form>

        {currentQuery.isError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400">
            Ocurrió un error al cargar la información del reporte.
          </div>
        )}

        {isExporting && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/90 px-4 py-3 text-sm font-medium text-teal-800 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-400">
            Preparando exportación completa con los filtros aplicados...
          </div>
        )}

        {currentQuery.isLoading ? (
          <div className={`${panelClass} flex h-56 flex-col items-center justify-center gap-2`}>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-emerald-600 dark:border-zinc-700 dark:border-t-emerald-500" />
            <p className="text-sm text-stone-500 dark:text-zinc-400">Cargando información...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentQuery.isFetching && !currentQuery.isLoading && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/90 px-4 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-900/20 dark:bg-emerald-950/10 dark:text-emerald-400">
                Actualizando resultados...
              </div>
            )}

            <StatsCards stats={reportStats} />

            <AnalyticsPanel title={`Distribución - ${activeTitle}`} chartData={chartData} />

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
    </div>
  )
}