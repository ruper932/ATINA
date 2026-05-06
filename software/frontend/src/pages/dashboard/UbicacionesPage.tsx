// src/pages/dashboard/UbicacionesPage.tsx
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

import { ubicacionesService } from '@/services/ubicaciones.service'
import { catalogosService, type TipoUbicacion } from '@/services/catalogos.service'
import type { UbicacionCreatePayload, UbicacionResponse, UbicacionUpdatePayload } from '@/types/ubicacion'

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
      latitud: item.latitud ? String(item.latitud) : '',
      longitud: item.longitud ? String(item.longitud) : '',
      altitud_m: item.altitud_m ? String(item.altitud_m) : '',
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

    const padreId = form.ubicacion_padre_id === 'none' || !form.ubicacion_padre_id 
      ? null 
      : Number(form.ubicacion_padre_id)

    const payloadBase = {
      tipo_ubicacion_id: Number(form.tipo_ubicacion_id),
      ubicacion_padre_id: padreId,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      latitud: form.latitud ? Number(form.latitud) : null,
      longitud: form.longitud ? Number(form.longitud) : null,
      altitud_m: form.altitud_m ? Number(form.altitud_m) : null,
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload: payloadBase })
    } else {
      createMutation.mutate(payloadBase)
    }
  }

  const filteredItems = useMemo(() => {
    const items = ubicacionesQuery.data ?? []
    const term = search.toLowerCase().trim()
    if (!term) return items
    return items.filter(
      (item) =>
        String(item.id).includes(term) ||
        item.nombre.toLowerCase().includes(term)
    )
  }, [ubicacionesQuery.data, search])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const ubicacionesPadreDisponibles = (ubicacionesQuery.data ?? []).filter(
    (u) => editingItem ? u.id !== editingItem.id : true
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ubicaciones</h1>
          <p className="text-muted-foreground">Gestiona las ubicaciones físicas del predio.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
            queryClient.invalidateQueries({ queryKey: ['tipos-ubicacion'] })
          }}>
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
                Nueva ubicación
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Editar ubicación' : 'Crear ubicación'}</DialogTitle>
                <DialogDescription>Completa los datos de la ubicación física.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  
                  <div className="space-y-2">
                    <Label>Tipo de ubicación *</Label>
                    <Select 
                      value={form.tipo_ubicacion_id} 
                      onValueChange={(value) => setForm(p => ({...p, tipo_ubicacion_id: value}))}
                      disabled={tiposUbicacionQuery.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={tiposUbicacionQuery.isLoading ? "Cargando..." : "Selecciona un tipo"} />
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
                      onValueChange={(value) => setForm(p => ({...p, ubicacion_padre_id: value}))}
                    >
                      <SelectTrigger>
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
                    <Input value={form.nombre} onChange={(e) => setForm(p => ({...p, nombre: e.target.value}))} placeholder="Ej. Invernadero Norte" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Descripción</Label>
                    <Textarea value={form.descripcion} onChange={(e) => setForm(p => ({...p, descripcion: e.target.value}))} />
                  </div>
                </div>

                {apiError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{apiError}</div>}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetFormAndClose}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por ID o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Padre</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.map((item) => {
            const tipoEncontrado = tipos.find((t: TipoUbicacion) => t.id === item.tipo_ubicacion_id)
            const nombreTipo = tipoEncontrado ? tipoEncontrado.nombre : `ID: ${item.tipo_ubicacion_id}`
            
            const padreEncontrado = (ubicacionesQuery.data ?? []).find((u) => u.id === item.ubicacion_padre_id)
            const nombrePadre = padreEncontrado ? padreEncontrado.nombre : (item.ubicacion_padre_id ? `ID: ${item.ubicacion_padre_id}` : '-')

            return (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell className="font-medium">{item.nombre}</TableCell>
                <TableCell>{nombreTipo}</TableCell>
                <TableCell className="text-muted-foreground">{nombrePadre}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditModal(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}