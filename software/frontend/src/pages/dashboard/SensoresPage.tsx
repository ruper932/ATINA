import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  Activity,
  Cpu,
  Waves,
  CalendarDays,
  Info,
} from 'lucide-react'

import { sensoresService } from '@/services/sensores.service'
import { dispositivosService } from '@/services/dispositivos.service'
import { catalogosService } from '@/services/catalogos.service'
import type {
  SensorCreatePayload,
  SensorResponse,
  SensorUpdatePayload,
} from '@/types/sensor'

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
  dispositivo_id: string
  tipo_sensor_id: string
  codigo: string
  nombre: string
  modelo: string
  numero_serie: string
  precision_valor: string
  estado_sensor_id: string
  fecha_instalacion: string
}

const initialForm: FormState = {
  dispositivo_id: '',
  tipo_sensor_id: '',
  codigo: '',
  nombre: '',
  modelo: '',
  numero_serie: '',
  precision_valor: '',
  estado_sensor_id: '',
  fecha_instalacion: '',
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

  if (value.includes('activo')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
  }

  return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300'
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export default function SensoresPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SensorResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const sensoresQuery = useQuery({
    queryKey: ['sensores'],
    queryFn: sensoresService.getAll,
  })

  const dispositivosQuery = useQuery({
    queryKey: ['dispositivos'],
    queryFn: dispositivosService.getAll,
  })

  const tiposSensorQuery = useQuery({
    queryKey: ['catalogos', 'tipos-sensor'],
    queryFn: catalogosService.getTiposSensor,
  })

  const estadosSensorQuery = useQuery({
    queryKey: ['catalogos', 'estados-sensor'],
    queryFn: catalogosService.getEstadosSensor,
  })

  const createMutation = useMutation({
    mutationFn: (payload: SensorCreatePayload) => sensoresService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sensores'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SensorUpdatePayload }) =>
      sensoresService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sensores'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sensoresService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sensores'] })
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

  function openEditModal(item: SensorResponse) {
    setEditingItem(item)
    setForm({
      dispositivo_id: String(item.dispositivo_id),
      tipo_sensor_id: String(item.tipo_sensor_id),
      codigo: item.codigo,
      nombre: item.nombre,
      modelo: item.modelo ?? '',
      numero_serie: item.numero_serie ?? '',
      precision_valor: item.precision_valor ? String(item.precision_valor) : '',
      estado_sensor_id: String(item.estado_sensor_id),
      fecha_instalacion: item.fecha_instalacion ?? '',
    })
    setApiError(null)
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    if (
      !form.dispositivo_id ||
      !form.tipo_sensor_id ||
      !form.estado_sensor_id ||
      !form.codigo.trim() ||
      !form.nombre.trim()
    ) {
      setApiError('Completa todos los campos obligatorios marcados con *.')
      return
    }

    const payloadBase: SensorCreatePayload = {
      dispositivo_id: parseInt(form.dispositivo_id, 10),
      tipo_sensor_id: parseInt(form.tipo_sensor_id, 10),
      estado_sensor_id: parseInt(form.estado_sensor_id, 10),
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      modelo: form.modelo.trim() === '' ? null : form.modelo.trim(),
      numero_serie: form.numero_serie.trim() === '' ? null : form.numero_serie.trim(),
      precision_valor: form.precision_valor.trim() === '' ? null : Number(form.precision_valor),
      fecha_instalacion: form.fecha_instalacion === '' ? null : form.fecha_instalacion,
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload: payloadBase })
    } else {
      createMutation.mutate(payloadBase)
    }
  }

  const filteredItems = useMemo(() => {
    const items = sensoresQuery.data ?? []
    const term = search.toLowerCase().trim()

    if (!term) return items

    return items.filter(
      (item) =>
        String(item.id).includes(term) ||
        item.codigo.toLowerCase().includes(term) ||
        item.nombre.toLowerCase().includes(term)
    )
  }, [sensoresQuery.data, search])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const totalSensores = sensoresQuery.data?.length ?? 0

  const activos = (sensoresQuery.data ?? []).filter((item) => {
    const estadoNombre =
      item.estado_sensor_nombre ??
      estadosSensorQuery.data?.find((estado) => estado.id === item.estado_sensor_id)?.nombre ??
      ''

    return estadoNombre.trim().toLowerCase() === 'activo'
  }).length

  const conPrecision = (sensoresQuery.data ?? []).filter(
    (item) => item.precision_valor !== null && item.precision_valor !== undefined
  ).length

  const conFecha = (sensoresQuery.data ?? []).filter((item) =>
    Boolean(item.fecha_instalacion)
  ).length

  const stats: StatCard[] = [
    {
      title: 'Sensores',
      value: String(totalSensores),
      helper: 'Sensores registrados en monitoreo',
      icon: Cpu,
      tone: 'emerald',
    },
    {
      title: 'Activos',
      value: String(activos),
      helper: 'Sensores con estado operativo',
      icon: Activity,
      tone: 'teal',
    },
    {
      title: 'Con precisión',
      value: String(conPrecision),
      helper: 'Sensores con precisión documentada',
      icon: Waves,
      tone: 'blue',
    },
    {
      title: 'Con instalación',
      value: String(conFecha),
      helper: 'Sensores con fecha registrada',
      icon: CalendarDays,
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
              IoT y sensórica
            </Badge>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Sensores
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              Gestiona los sensores conectados a los dispositivos y mantén ordenados sus datos
              técnicos.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['sensores'] })
                queryClient.invalidateQueries({ queryKey: ['catalogos'] })
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar
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
                  Nuevo sensor
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] border border-border/70 bg-card sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-foreground">
                    {editingItem ? 'Editar sensor' : 'Crear sensor'}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-6">
                    Completa los datos técnicos del sensor.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="dispositivo_id">Dispositivo de conexión *</Label>
                      <Select
                        value={form.dispositivo_id}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, dispositivo_id: value }))
                        }
                        disabled={dispositivosQuery.isLoading || dispositivosQuery.isError}
                      >
                        <SelectTrigger className="rounded-2xl border-border/70 bg-background">
                          <SelectValue
                            placeholder={
                              dispositivosQuery.isLoading
                                ? 'Cargando dispositivos...'
                                : 'Selecciona un dispositivo'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {dispositivosQuery.data?.map((disp) => (
                            <SelectItem key={disp.id} value={String(disp.id)}>
                              {disp.nombre} ({disp.codigo})
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
                        placeholder="SENS-001"
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
                        placeholder="Sensor de humedad central"
                        maxLength={100}
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo_sensor_id">Tipo de Sensor *</Label>
                      <Select
                        value={form.tipo_sensor_id}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, tipo_sensor_id: value }))
                        }
                        disabled={tiposSensorQuery.isLoading || tiposSensorQuery.isError}
                      >
                        <SelectTrigger className="rounded-2xl border-border/70 bg-background">
                          <SelectValue
                            placeholder={
                              tiposSensorQuery.isLoading ? 'Cargando...' : 'Selecciona un tipo'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposSensorQuery.data?.map((tipo) => (
                            <SelectItem key={tipo.id} value={String(tipo.id)}>
                              {tipo.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estado_sensor_id">Estado del Sensor *</Label>
                      <Select
                        value={form.estado_sensor_id}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, estado_sensor_id: value }))
                        }
                        disabled={estadosSensorQuery.isLoading || estadosSensorQuery.isError}
                      >
                        <SelectTrigger className="rounded-2xl border-border/70 bg-background">
                          <SelectValue
                            placeholder={
                              estadosSensorQuery.isLoading ? 'Cargando...' : 'Selecciona un estado'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {estadosSensorQuery.data?.map((estado) => (
                            <SelectItem key={estado.id} value={String(estado.id)}>
                              {estado.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modelo">Modelo</Label>
                      <Input
                        id="modelo"
                        value={form.modelo}
                        onChange={(e) => setForm((prev) => ({ ...prev, modelo: e.target.value }))}
                        placeholder="DHT22"
                        maxLength={50}
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numero_serie">Número de Serie</Label>
                      <Input
                        id="numero_serie"
                        value={form.numero_serie}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, numero_serie: e.target.value }))
                        }
                        placeholder="SN-12345"
                        maxLength={100}
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="precision_valor">Precisión de lectura</Label>
                      <Input
                        id="precision_valor"
                        type="number"
                        step="0.0001"
                        value={form.precision_valor}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, precision_valor: e.target.value }))
                        }
                        placeholder="0.05"
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fecha_instalacion">Fecha de Instalación</Label>
                      <Input
                        id="fecha_instalacion"
                        type="date"
                        value={form.fecha_instalacion}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, fecha_instalacion: e.target.value }))
                        }
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-sky-200/70 bg-sky-50/60 p-4 dark:border-sky-900/30 dark:bg-sky-950/10">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300">
                        <Info className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Recomendación de registro
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Completa modelo, número de serie, precisión y fecha de instalación para
                          mejorar trazabilidad y mantenimiento.
                        </p>
                      </div>
                    </div>
                  </div>

                  {apiError && (
                    <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400">
                      {apiError}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <MetricCard key={item.title} item={item} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.7fr_0.9fr]">
        <SurfaceCard
          title="Listado de sensores"
          description="Busca por código o nombre y administra cada registro."
          action={
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-2xl border-border/70 bg-background pl-9"
              />
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
                    Dispositivo
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Tipo
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Estado
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Modelo
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Instalado
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sensoresQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      Cargando sensores...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No se encontraron sensores.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const tipo = tiposSensorQuery.data?.find((t) => t.id === item.tipo_sensor_id)
                    const estado = estadosSensorQuery.data?.find((e) => e.id === item.estado_sensor_id)
                    const dispositivo = dispositivosQuery.data?.find(
                      (d) => d.id === item.dispositivo_id
                    )

                    const estadoNombre =
                      estado?.nombre ?? item.estado_sensor_nombre ?? String(item.estado_sensor_id)

                    return (
                      <TableRow
                        key={item.id}
                        className="border-b border-border/70 transition-colors hover:bg-accent/30"
                      >
                        <TableCell className="font-medium text-foreground">{item.codigo}</TableCell>
                        <TableCell className="text-foreground">{item.nombre}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {dispositivo ? dispositivo.nombre : item.dispositivo_id}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="rounded-full border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300"
                          >
                            {tipo ? tipo.nombre : item.tipo_sensor_id}
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
                        <TableCell className="text-muted-foreground">{item.modelo || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(item.fecha_instalacion)}
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
                                if (window.confirm(`¿Eliminar el sensor ${item.codigo}?`)) {
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

        <SurfaceCard
          title="Cobertura técnica"
          description="Pequeños indicadores para enriquecer la lectura visual del módulo."
        >
          <div className="space-y-3">
            <div className="rounded-[22px] border border-emerald-200/80 bg-emerald-50/70 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/10">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Sensores operativos
              </p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{activos}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Estado activo dentro del inventario actual.
              </p>
            </div>

            <div className="rounded-[22px] border border-sky-200/80 bg-sky-50/70 p-4 dark:border-sky-900/30 dark:bg-sky-950/10">
              <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                Precisión registrada
              </p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{conPrecision}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sensores con dato técnico de precisión.
              </p>
            </div>

            <div className="rounded-[22px] border border-violet-200/80 bg-violet-50/70 p-4 dark:border-violet-900/30 dark:bg-violet-950/10">
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                Fecha de instalación
              </p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{conFecha}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sensores con historial de instalación documentado.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </section>
    </div>
  )
}