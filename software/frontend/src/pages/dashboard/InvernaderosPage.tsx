import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

import { invernaderosService } from '@/services/invernaderos.service'
import { ubicacionesService } from '@/services/ubicaciones.service'
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

export default function InvernaderosPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InvernaderoResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const invernaderosQuery = useQuery({
    queryKey: ['invernaderos'],
    queryFn: invernaderosService.getAll,
  })

  const ubicacionesQuery = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: ubicacionesService.getAll,
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

    const payloadBase = {
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

  const filteredItems = useMemo(() => {
    const items = invernaderosQuery.data ?? []
    const term = search.toLowerCase().trim()
    if (!term) return items
    return items.filter(
      (item) =>
        String(item.id).includes(term) ||
        item.codigo.toLowerCase().includes(term) ||
        item.nombre.toLowerCase().includes(term)
    )
  }, [invernaderosQuery.data, search])

  const ubicaciones = ubicacionesQuery.data ?? []
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invernaderos</h1>
          <p className="text-muted-foreground">
            Gestiona los invernaderos registrados en el sistema.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['invernaderos'] })
              queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
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
                Nuevo invernadero
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Editar invernadero' : 'Crear invernadero'}
                </DialogTitle>
                <DialogDescription>
                  Completa los datos principales del invernadero.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Ubicación</Label>
                    <Select
                      value={form.ubicacion_id}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, ubicacion_id: value }))
                      }
                      disabled={ubicacionesQuery.isLoading || ubicacionesQuery.error !== null}
                    >
                      <SelectTrigger>
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
                            {u.nombre} (ID {u.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado_invernadero_id">Estado ID</Label>
                    <Input
                      id="estado_invernadero_id"
                      type="number"
                      value={form.estado_invernadero_id}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          estado_invernadero_id: e.target.value,
                        }))
                      }
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      value={form.codigo}
                      onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
                      placeholder="INV-001"
                      maxLength={30}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={form.nombre}
                      onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Invernadero central"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area_m2">Área m²</Label>
                    <Input
                      id="area_m2"
                      type="number"
                      step="0.01"
                      value={form.area_m2}
                      onChange={(e) => setForm((prev) => ({ ...prev, area_m2: e.target.value }))}
                      placeholder="120.50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prioridad_riego">Prioridad de riego</Label>
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
                      className="min-h-[110px]"
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
                    {isSubmitting ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
              <TableHead>Ubicación</TableHead>
              <TableHead>Área m²</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado ID</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {invernaderosQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={9}>Cargando invernaderos...</TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>No se encontraron invernaderos.</TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const ubicacion = ubicaciones.find((u) => u.id === item.ubicacion_id)
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell className="font-medium">{item.codigo}</TableCell>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>{ubicacion ? ubicacion.nombre : `ID ${item.ubicacion_id}`}</TableCell>
                    <TableCell>{String(item.area_m2)}</TableCell>
                    <TableCell>{item.prioridad_riego}</TableCell>
                    <TableCell>{item.estado_invernadero_id}</TableCell>
                    <TableCell>{new Date(item.creado_en).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditModal(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="destructive"
                          size="icon"
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
    </div>
  )
}