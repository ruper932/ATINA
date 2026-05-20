// src/pages/dashboard/UbicacionesPage.tsx
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  MapPinned,
  Layers3,
  Map,
  Info,
} from 'lucide-react'

import { ubicacionesService } from '@/services/ubicaciones.service'
import { catalogosService, type TipoUbicacion } from '@/services/catalogos.service'
import type {
  UbicacionCreatePayload,
  UbicacionResponse,
  UbicacionUpdatePayload,
} from '@/types/ubicacion'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  tipo_ubicacion_id: string
  ubicacion_padre_id: string
  nombre: string
  descripcion: string
  latitud: string
  longitud: string
  altitud_m: string
}

const initialForm: FormState = {
  tipo_ubicacion_id: '',
  ubicacion_padre_id: 'none',
  nombre: '',
  descripcion: '',
  latitud: '',
  longitud: '',
  altitud_m: '',
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

function getTipoBadgeClass(nombre?: string | null) {
  const value = String(nombre ?? '').trim().toLowerCase()

  if (value.includes('sector') || value.includes('zona')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
  }

  if (value.includes('invernadero') || value.includes('ambiente')) {
    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300'
  }

  if (value.includes('parcela') || value.includes('bloque')) {
    return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-300'
  }

  return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300'
}

function formatCoordinate(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return Number(value).toFixed(6)
}

function formatAltitude(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return `${value} m`
}

export default function UbicacionesPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<UbicacionResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const ubicacionesQuery = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: ubicacionesService.getAll,
  })

  const tiposUbicacionQuery = useQuery({
    queryKey: ['tipos-ubicacion'],
    queryFn: catalogosService.getTiposUbicacion,
  })

  const tipos = tiposUbicacionQuery.data ?? []
  const ubicaciones = ubicacionesQuery.data ?? []

  const createMutation = useMutation({
    mutationFn: (payload: UbicacionCreatePayload) => ubicacionesService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UbicacionUpdatePayload }) =>
      ubicacionesService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ubicacionesService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
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

  function openEditModal(item: UbicacionResponse) {
    setEditingItem(item)
    setForm({
      tipo_ubicacion_id: String(item.tipo_ubicacion_id),
      ubicacion_padre_id: item.ubicacion_padre_id ? String(item.ubicacion_padre_id) : 'none',
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      latitud: item.latitud !== null && item.latitud !== undefined ? String(item.latitud) : '',
      longitud: item.longitud !== null && item.longitud !== undefined ? String(item.longitud) : '',
      altitud_m: item.altitud_m !== null && item.altitud_m !== undefined ? String(item.altitud_m) : '',
    })
    setApiError(null)
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    if (!form.nombre.trim() || !form.tipo_ubicacion_id) {
      setApiError('El nombre y el tipo de ubicación son obligatorios.')
      return
    }

    const padreId =
      form.ubicacion_padre_id === 'none' || !form.ubicacion_padre_id
        ? null
        : Number(form.ubicacion_padre_id)

    const payloadBase: UbicacionCreatePayload = {
      tipo_ubicacion_id: Number(form.tipo_ubicacion_id),
      ubicacion_padre_id: padreId,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      latitud: form.latitud.trim() === '' ? null : Number(form.latitud),
      longitud: form.longitud.trim() === '' ? null : Number(form.longitud),
      altitud_m: form.altitud_m.trim() === '' ? null : Number(form.altitud_m),
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload: payloadBase })
    } else {
      createMutation.mutate(payloadBase)
    }
  }

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase().trim()

    if (!term) return ubicaciones

    return ubicaciones.filter(
      (item) =>
        String(item.id).includes(term) ||
        item.nombre.toLowerCase().includes(term) ||
        String(item.descripcion ?? '').toLowerCase().includes(term)
    )
  }, [ubicaciones, search])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const ubicacionesPadreDisponibles = ubicaciones.filter((u) =>
    editingItem ? u.id !== editingItem.id : true
  )

  const totalUbicaciones = ubicaciones.length
  const conPadre = ubicaciones.filter((item) => item.ubicacion_padre_id !== null).length
  const conCoordenadas = ubicaciones.filter(
    (item) => item.latitud !== null && item.longitud !== null
  ).length
  const tiposRegistrados = new Set(ubicaciones.map((item) => item.tipo_ubicacion_id)).size

  const stats: StatCard[] = [
    {
      title: 'Ubicaciones',
      value: String(totalUbicaciones),
      helper: 'Ubicaciones físicas registradas',
      icon: MapPinned,
      tone: 'emerald',
    },
    {
      title: 'Con jerarquía',
      value: String(conPadre),
      helper: 'Ubicaciones vinculadas a una ubicación padre',
      icon: Layers3,
      tone: 'teal',
    },
    {
      title: 'Con coordenadas',
      value: String(conCoordenadas),
      helper: 'Ubicaciones con latitud y longitud registradas',
      icon: Map,
      tone: 'blue',
    },
    {
      title: 'Tipos usados',
      value: String(tiposRegistrados),
      helper: 'Tipos de ubicación actualmente en uso',
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
              Georreferenciación y estructura
            </Badge>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Ubicaciones
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              Gestiona las ubicaciones físicas del predio, define jerarquías y organiza la
              estructura espacial del sistema.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
                queryClient.invalidateQueries({ queryKey: ['tipos-ubicacion'] })
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
                  Nueva ubicación
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] border border-border/70 bg-card sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-foreground">
                    {editingItem ? 'Editar ubicación' : 'Crear ubicación'}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-6">
                    Completa los datos de la ubicación física.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tipo de ubicación *</Label>
                      <Select
                        value={form.tipo_ubicacion_id}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, tipo_ubicacion_id: value }))
                        }
                        disabled={tiposUbicacionQuery.isLoading || tiposUbicacionQuery.isError}
                      >
                        <SelectTrigger className="rounded-2xl border-border/70 bg-background">
                          <SelectValue
                            placeholder={
                              tiposUbicacionQuery.isLoading
                                ? 'Cargando...'
                                : 'Selecciona un tipo'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {tipos.map((tipo: TipoUbicacion) => (
                            <SelectItem key={tipo.id} value={String(tipo.id)}>
                              {tipo.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Ubicación padre</Label>
                      <Select
                        value={form.ubicacion_padre_id}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, ubicacion_padre_id: value }))
                        }
                      >
                        <SelectTrigger className="rounded-2xl border-border/70 bg-background">
                          <SelectValue placeholder="Ninguna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Ninguna --</SelectItem>
                          {ubicacionesPadreDisponibles.map((u) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={form.nombre}
                        onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                        placeholder="Ej. Invernadero Norte"
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={form.descripcion}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, descripcion: e.target.value }))
                        }
                        className="min-h-[110px] rounded-2xl border-border/70 bg-background"
                        placeholder="Describe el propósito o alcance de esta ubicación"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Latitud</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={form.latitud}
                        onChange={(e) => setForm((prev) => ({ ...prev, latitud: e.target.value }))}
                        placeholder="-16.500000"
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Longitud</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={form.longitud}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, longitud: e.target.value }))
                        }
                        placeholder="-68.150000"
                        className="rounded-2xl border-border/70 bg-background"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Altitud (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.altitud_m}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, altitud_m: e.target.value }))
                        }
                        placeholder="3650"
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
                          Registra coordenadas y altitud cuando estén disponibles para mejorar la
                          trazabilidad territorial y la futura visualización en mapas.
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

      <section>
        <SurfaceCard
          title="Listado de ubicaciones"
          description="Busca por identificador, nombre o descripción y administra la estructura física."
          action={
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-2xl border-border/70 bg-background pl-9"
              />
            </div>
          }
        >
          <div className="overflow-x-auto rounded-[22px] border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/70 bg-muted/40">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    ID
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Nombre
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Tipo
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Padre
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Latitud
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Longitud
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Altitud
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {ubicacionesQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      Cargando ubicaciones...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No se encontraron ubicaciones.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const tipoEncontrado = tipos.find(
                      (t: TipoUbicacion) => t.id === item.tipo_ubicacion_id
                    )
                    const nombreTipo = tipoEncontrado
                      ? tipoEncontrado.nombre
                      : `ID: ${item.tipo_ubicacion_id}`

                    const padreEncontrado = ubicaciones.find(
                      (u) => u.id === item.ubicacion_padre_id
                    )
                    const nombrePadre = padreEncontrado
                      ? padreEncontrado.nombre
                      : item.ubicacion_padre_id
                        ? `ID: ${item.ubicacion_padre_id}`
                        : '-'

                    return (
                      <TableRow
                        key={item.id}
                        className="border-b border-border/70 transition-colors hover:bg-accent/30"
                      >
                        <TableCell className="font-medium text-foreground">{item.id}</TableCell>
                        <TableCell className="text-foreground">{item.nombre}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`rounded-full border ${getTipoBadgeClass(nombreTipo)}`}
                          >
                            {nombreTipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{nombrePadre}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCoordinate(item.latitud)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCoordinate(item.longitud)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatAltitude(item.altitud_m)}
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
                                if (window.confirm(`¿Eliminar la ubicación ${item.nombre}?`)) {
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