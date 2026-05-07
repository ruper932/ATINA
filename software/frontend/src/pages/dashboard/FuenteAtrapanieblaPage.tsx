import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Trash2, Plus, RefreshCw } from 'lucide-react'

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
      await queryClient.invalidateQueries({ queryKey: ['fuentes-agua-atrapanieblas'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fuentesAguaService.removeRelacion(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['fuentes-agua-atrapanieblas'] })
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
      const fuente = (fuentesQuery.data ?? []).find((f) => f.id === rel.fuente_agua_id)
      const atrapa = (atrapanieblasQuery.data ?? []).find((a) => a.id === rel.atrapaniebla_id)

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Atrapaniebla - Fuente</h1>
          <p className="text-muted-foreground">
            Vincula las fuentes de agua con los atrapanieblas.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['fuentes-agua-atrapanieblas'] })
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
              <Button onClick={openCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva relación
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Nueva relación</DialogTitle>
                <DialogDescription>
                  Selecciona una fuente de agua y un atrapaniebla.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label>Fuente de agua</Label>
                  <Select
                    value={form.fuente_agua_id}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, fuente_agua_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una fuente" />
                    </SelectTrigger>
                    <SelectContent>
                      {(fuentesQuery.data ?? []).map((fuente) => (
                        <SelectItem key={fuente.id} value={String(fuente.id)}>
                          {fuente.codigo} - {fuente.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Atrapaniebla</Label>
                  <Select
                    value={form.atrapaniebla_id}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, atrapaniebla_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un atrapaniebla" />
                    </SelectTrigger>
                    <SelectContent>
                      {(atrapanieblasQuery.data ?? []).map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.codigo} - {item.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {apiError && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {apiError}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetFormAndClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Vincular'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(relacionesQuery.error || fuentesQuery.error || atrapanieblasQuery.error) && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          Error al cargar las relaciones.
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por id, código o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:max-w-sm"
        />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fuente de agua</TableHead>
              <TableHead>Atrapaniebla</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {relacionesQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>Cargando relaciones...</TableCell>
              </TableRow>
            ) : filteredRelaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No se encontraron relaciones.</TableCell>
              </TableRow>
            ) : (
              filteredRelaciones.map((rel) => {
                const fuente = fuentesMap.get(rel.fuente_agua_id)
                const atrapa = atrapanieblasMap.get(rel.atrapaniebla_id)

                return (
                  <TableRow key={rel.id}>
                    <TableCell>{rel.id}</TableCell>
                    <TableCell>
                      {fuente ? `${fuente.codigo} - ${fuente.nombre}` : `Fuente #${rel.fuente_agua_id}`}
                    </TableCell>
                    <TableCell>
                      {atrapa ? `${atrapa.codigo} - ${atrapa.nombre}` : `Atrapaniebla #${rel.atrapaniebla_id}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="icon"
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
  )
}