import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Pencil, Trash2, Plus, RefreshCw } from 'lucide-react'

import { fuentesAguaService } from '@/services/fuentesAgua.service'
import type {
  EstadoFuenteAguaResponse,
  FuenteAguaCreatePayload,
  FuenteAguaResponse,
  FuenteAguaUpdatePayload,
  TipoFuenteAguaResponse,
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
  ubicacion_id: '',
  tipo_fuente_agua_id: '',
  codigo: '',
  nombre: '',
  descripcion: '',
  capacidad_l: '',
  estado_fuente_agua_id: '',
}

export default function FuentesAguaPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingFuente, setEditingFuente] = useState<FuenteAguaResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

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

  const createMutation = useMutation({
    mutationFn: (payload: FuenteAguaCreatePayload) => fuentesAguaService.create(payload),
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
      ubicacion_id: fuente.ubicacion_id ? String(fuente.ubicacion_id) : '',
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

    if (!form.codigo || !form.nombre || !form.tipo_fuente_agua_id || !form.estado_fuente_agua_id) {
      setApiError('Completa todos los campos obligatorios.')
      return
    }

    const payload: FuenteAguaCreatePayload = {
      ubicacion_id: form.ubicacion_id ? Number(form.ubicacion_id) : null,
      tipo_fuente_agua_id: Number(form.tipo_fuente_agua_id),
      codigo: form.codigo,
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      capacidad_l: form.capacidad_l ? Number(form.capacidad_l) : null,
      estado_fuente_agua_id: Number(form.estado_fuente_agua_id),
    }

    if (editingFuente) {
      updateMutation.mutate({ id: editingFuente.id, payload })
      return
    }

    createMutation.mutate(payload)
  }

  const filteredFuentes = useMemo(() => {
    const items = fuentesQuery.data ?? []
    const term = search.toLowerCase().trim()
    if (!term) return items

    return items.filter(
      (fuente) =>
        fuente.codigo.toLowerCase().includes(term) ||
        fuente.nombre.toLowerCase().includes(term) ||
        String(fuente.id).includes(term)
    )
  }, [fuentesQuery.data, search])

  const tiposMap = useMemo(() => {
    const map = new Map<number, string>()
    ;(tiposQuery.data ?? []).forEach((tipo: TipoFuenteAguaResponse) => {
      map.set(tipo.id, tipo.nombre)
    })
    return map
  }, [tiposQuery.data])

  const estadosMap = useMemo(() => {
    const map = new Map<number, string>()
    ;(estadosQuery.data ?? []).forEach((estado: EstadoFuenteAguaResponse) => {
      map.set(estado.id, estado.nombre)
    })
    return map
  }, [estadosQuery.data])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fuentes de Agua</h1>
          <p className="text-muted-foreground">
            Gestiona las fuentes de agua registradas en el sistema.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['fuentes-agua'] })
              queryClient.invalidateQueries({ queryKey: ['tipos-fuente-agua'] })
              queryClient.invalidateQueries({ queryKey: ['estados-fuente-agua'] })
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
                Nueva fuente
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingFuente ? 'Editar fuente' : 'Crear fuente'}</DialogTitle>
                <DialogDescription>
                  Completa los datos requeridos de la fuente de agua.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      value={form.codigo}
                      onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
                      placeholder="FA-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={form.nombre}
                      onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Tanque principal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ubicacion_id">Ubicación ID</Label>
                    <Input
                      id="ubicacion_id"
                      value={form.ubicacion_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, ubicacion_id: e.target.value }))}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacidad_l">Capacidad (L)</Label>
                    <Input
                      id="capacidad_l"
                      type="number"
                      step="0.01"
                      value={form.capacidad_l}
                      onChange={(e) => setForm((prev) => ({ ...prev, capacidad_l: e.target.value }))}
                      placeholder="1000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={form.tipo_fuente_agua_id}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, tipo_fuente_agua_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {(tiposQuery.data ?? []).map((tipo) => (
                          <SelectItem key={tipo.id} value={String(tipo.id)}>
                            {tipo.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={form.estado_fuente_agua_id}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, estado_fuente_agua_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {(estadosQuery.data ?? []).map((estado) => (
                          <SelectItem key={estado.id} value={String(estado.id)}>
                            {estado.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={form.descripcion}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, descripcion: e.target.value }))
                      }
                      placeholder="Describe la fuente de agua"
                    />
                  </div>
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
                    {isSubmitting ? 'Guardando...' : editingFuente ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(fuentesQuery.error || tiposQuery.error || estadosQuery.error) && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          Error al cargar el módulo de fuentes de agua.
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
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
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
                <TableCell colSpan={8}>Cargando fuentes de agua...</TableCell>
              </TableRow>
            ) : filteredFuentes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>No se encontraron fuentes de agua.</TableCell>
              </TableRow>
            ) : (
              filteredFuentes.map((fuente) => (
                <TableRow key={fuente.id}>
                  <TableCell>{fuente.id}</TableCell>
                  <TableCell>{fuente.codigo}</TableCell>
                  <TableCell>{fuente.nombre}</TableCell>
                  <TableCell>
                    {tiposMap.get(fuente.tipo_fuente_agua_id) ?? `Tipo #${fuente.tipo_fuente_agua_id}`}
                  </TableCell>
                  <TableCell>{fuente.capacidad_l ?? '—'}</TableCell>
                  <TableCell>
                    {estadosMap.get(fuente.estado_fuente_agua_id) ?? `Estado #${fuente.estado_fuente_agua_id}`}
                  </TableCell>
                  <TableCell>{new Date(fuente.creado_en).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEditModal(fuente)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}