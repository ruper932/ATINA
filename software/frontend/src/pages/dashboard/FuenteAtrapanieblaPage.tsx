import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Link2,
  Droplets,
  Wind,
  Unlink,
} from 'lucide-react'

import { fuentesAguaService } from '@/services/fuentesAgua.service'
import type {
  AtrapanieblaResponse,
  FuenteAguaAtrapanieblaCreatePayload,
  FuenteAguaResponse,
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

type FormState = {
  fuente_agua_id: string
  atrapaniebla_id: string
}

const initialForm: FormState = {
  fuente_agua_id: '',
  atrapaniebla_id: '',
}

export default function FuenteAtrapanieblaPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const relacionesQuery = useQuery({
    queryKey: ['fuentes-agua-atrapanieblas'],
    queryFn: fuentesAguaService.getRelaciones,
  })

  const fuentesQuery = useQuery({
    queryKey: ['fuentes-agua'],
    queryFn: fuentesAguaService.getAll,
  })

  const atrapanieblasQuery = useQuery({
    queryKey: ['atrapanieblas'],
    queryFn: fuentesAguaService.getAtrapanieblas,
  })

  const createMutation = useMutation({
    mutationFn: (payload: FuenteAguaAtrapanieblaCreatePayload) =>
      fuentesAguaService.createRelacion(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['fuentes-agua-atrapanieblas'],
      })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fuentesAguaService.removeRelacion(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['fuentes-agua-atrapanieblas'],
      })
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
    setApiError(null)
    setOpen(false)
  }

  function openCreateModal() {
    setForm(initialForm)
    setApiError(null)
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    if (!form.fuente_agua_id || !form.atrapaniebla_id) {
      setApiError('Selecciona una fuente y un atrapaniebla.')
      return
    }

    createMutation.mutate({
      fuente_agua_id: Number(form.fuente_agua_id),
      atrapaniebla_id: Number(form.atrapaniebla_id),
    })
  }

  const filteredRelaciones = useMemo(() => {
    const items = relacionesQuery.data ?? []
    const term = search.toLowerCase().trim()
    if (!term) return items

    return items.filter((rel) => {
      const fuente = (fuentesQuery.data ?? []).find(
        (f) => f.id === rel.fuente_agua_id
      )
      const atrapa = (atrapanieblasQuery.data ?? []).find(
        (a) => a.id === rel.atrapaniebla_id
      )

      return (
        String(rel.id).includes(term) ||
        String(rel.fuente_agua_id).includes(term) ||
        String(rel.atrapaniebla_id).includes(term) ||
        fuente?.codigo.toLowerCase().includes(term) ||
        fuente?.nombre.toLowerCase().includes(term) ||
        atrapa?.codigo.toLowerCase().includes(term) ||
        atrapa?.nombre.toLowerCase().includes(term)
      )
    })
  }, [relacionesQuery.data, search, fuentesQuery.data, atrapanieblasQuery.data])

  const fuentesMap = useMemo(() => {
    const map = new Map<number, FuenteAguaResponse>()
    ;(fuentesQuery.data ?? []).forEach((f) => map.set(f.id, f))
    return map
  }, [fuentesQuery.data])

  const atrapanieblasMap = useMemo(() => {
    const map = new Map<number, AtrapanieblaResponse>()
    ;(atrapanieblasQuery.data ?? []).forEach((a) => map.set(a.id, a))
    return map
  }, [atrapanieblasQuery.data])

  const isSubmitting = createMutation.isPending
  const totalRelaciones = filteredRelaciones.length
  const totalFuentesDisponibles = (fuentesQuery.data ?? []).length
  const totalAtrapanieblasDisponibles = (atrapanieblasQuery.data ?? []).length

  const hasAnyData = (relacionesQuery.data ?? []).length > 0

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-cyan-50 via-background to-emerald-50 shadow-sm dark:from-cyan-950/20 dark:via-background dark:to-emerald-950/10">
        <div className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-xs font-medium text-cyan-700 shadow-sm dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-300">
              <Link2 className="h-3.5 w-3.5" />
              Relación operativa
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Atrapaniebla - Fuente
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
              Vincula fuentes de agua con atrapanieblas para representar relaciones
              funcionales dentro del sistema.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Relaciones
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {totalRelaciones}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Fuentes
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {totalFuentesDisponibles}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Atrapanieblas
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {totalAtrapanieblasDisponibles}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Gestión de relaciones
            </h2>
            <p className="text-sm text-muted-foreground">
              Crea y administra vínculos entre módulos de captación y abastecimiento.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="rounded-xl border-border/70"
              onClick={() => {
                queryClient.invalidateQueries({
                  queryKey: ['fuentes-agua-atrapanieblas'],
                })
                queryClient.invalidateQueries({ queryKey: ['fuentes-agua'] })
                queryClient.invalidateQueries({ queryKey: ['atrapanieblas'] })
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
                  className="rounded-xl bg-cyan-600 text-white shadow-sm hover:bg-cyan-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva relación
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 sm:max-w-xl">
                <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
                  <DialogTitle className="text-xl">Nueva relación</DialogTitle>
                  <DialogDescription>
                    Selecciona una fuente de agua y un atrapaniebla para vincularlos.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Fuente de agua *</Label>
                    <Select
                      value={form.fuente_agua_id || undefined}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, fuente_agua_id: value }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background">
                        <SelectValue placeholder="Selecciona una fuente" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/70">
                        {(fuentesQuery.data ?? []).map((fuente) => (
                          <SelectItem key={fuente.id} value={String(fuente.id)}>
                            {fuente.codigo} - {fuente.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Atrapaniebla *</Label>
                    <Select
                      value={form.atrapaniebla_id || undefined}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, atrapaniebla_id: value }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background">
                        <SelectValue placeholder="Selecciona un atrapaniebla" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/70">
                        {(atrapanieblasQuery.data ?? []).map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.codigo} - {item.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      className="rounded-xl bg-cyan-600 text-white hover:bg-cyan-700"
                    >
                      {isSubmitting ? 'Guardando...' : 'Vincular'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {(relacionesQuery.error || fuentesQuery.error || atrapanieblasQuery.error) && (
          <div className="px-5 pt-5">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              Error al cargar las relaciones.
            </div>
          </div>
        )}

        <div className="px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por id, código o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-xl border-border/70 pl-10"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              {totalRelaciones} resultado{totalRelaciones === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="overflow-hidden rounded-2xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-12">ID</TableHead>
                  <TableHead>Fuente de agua</TableHead>
                  <TableHead>Atrapaniebla</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {relacionesQuery.isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-28 text-center text-muted-foreground"
                    >
                      Cargando relaciones...
                    </TableCell>
                  </TableRow>
                ) : filteredRelaciones.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Unlink className="h-6 w-6" />
                        <p className="text-sm font-medium text-foreground">
                          {hasAnyData
                            ? 'No hay coincidencias para tu búsqueda'
                            : 'Aún no existen relaciones registradas'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {hasAnyData
                            ? 'Prueba con otro término de búsqueda.'
                            : 'Crea la primera relación entre una fuente y un atrapaniebla.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRelaciones.map((rel) => {
                    const fuente = fuentesMap.get(rel.fuente_agua_id)
                    const atrapa = atrapanieblasMap.get(rel.atrapaniebla_id)

                    return (
                      <TableRow
                        key={rel.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="font-medium">{rel.id}</TableCell>

                        <TableCell>
                          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300">
                            <Droplets className="h-4 w-4" />
                            {fuente
                              ? `${fuente.codigo} - ${fuente.nombre}`
                              : `Fuente #${rel.fuente_agua_id}`}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                            <Wind className="h-4 w-4" />
                            {atrapa
                              ? `${atrapa.codigo} - ${atrapa.nombre}`
                              : `Atrapaniebla #${rel.atrapaniebla_id}`}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20"
                            onClick={() => {
                              if (window.confirm('¿Eliminar esta relación?')) {
                                deleteMutation.mutate(rel.id)
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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