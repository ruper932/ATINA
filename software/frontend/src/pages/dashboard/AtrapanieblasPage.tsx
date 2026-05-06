// src/pages/dashboard/AtrapanieblasPage.tsx
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

import { atrapanieblasService } from '@/services/atrapanieblas.service'
import { ubicacionesService } from '@/services/ubicaciones.service'
import { catalogosService, type CatalogoBasico } from '@/services/catalogos.service'
import type { AtrapanieblaCreatePayload, AtrapanieblaResponse, AtrapanieblaUpdatePayload } from '@/types/atrapaniebla'

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

export default function AtrapanieblasPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AtrapanieblaResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const atrapanieblasQuery = useQuery({
    queryKey: ['atrapanieblas'],
    queryFn: atrapanieblasService.getAll,
  })

  // Dependencias para selects
  const ubicacionesQuery = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: ubicacionesService.getAll,
  })

  const estadosQuery = useQuery({
    queryKey: ['estados-atrapaniebla'],
    queryFn: catalogosService.getEstadosAtrapaniebla,
  })

  const createMutation = useMutation({
    mutationFn: (payload: AtrapanieblaCreatePayload) => atrapanieblasService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['atrapanieblas'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AtrapanieblaUpdatePayload }) =>
      atrapanieblasService.update(id, payload),
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

  const filteredItems = useMemo(() => {
    const items = atrapanieblasQuery.data ?? []
    const term = search.toLowerCase().trim()
    if (!term) return items
    return items.filter(
      (item) =>
        String(item.id).includes(term) ||
        item.codigo.toLowerCase().includes(term) ||
        item.nombre.toLowerCase().includes(term)
    )
  }, [atrapanieblasQuery.data, search])

  const ubicacionesData = ubicacionesQuery.data ?? []
  const estadosData = estadosQuery.data ?? []

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Atrapanieblas</h1>
          <p className="text-muted-foreground">Gestiona las estructuras de captación de agua.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['atrapanieblas'] })
            queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
            queryClient.invalidateQueries({ queryKey: ['estados-atrapaniebla'] })
          }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recargar
          </Button>

          <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetFormAndClose(); }}>
            <DialogTrigger asChild>
              <Button onClick={openCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo atrapaniebla
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Editar atrapaniebla' : 'Crear atrapaniebla'}</DialogTitle>
                <DialogDescription>Registra los detalles técnicos de la malla de captación.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  
                  <div className="space-y-2">
                    <Label>Ubicación *</Label>
                    <Select 
                        // Shadcn requiere que el value siempre sea un string válido que coincida con un SelectItem
                        // Si form.ubicacion_id está vacío, no le pases prop value para que muestre el placeholder
                        value={form.ubicacion_id || undefined} 
                        onValueChange={(val) => setForm(p => ({...p, ubicacion_id: val}))}
                        disabled={ubicacionesQuery.isLoading}
                    >
                        <SelectTrigger className="w-full">
                        <SelectValue placeholder={ubicacionesQuery.isLoading ? "Cargando ubicaciones..." : "Selecciona una ubicación"} />
                        </SelectTrigger>
                        
                        {/* Agregamos z-[100] por si se esconde detrás del modal */}
                        <SelectContent className="max-h-[300px] z-[100]">
                        {/* Opción por si se permite no seleccionar nada (opcional) */}
                        <SelectItem value="none" className="italic text-muted-foreground">
                            -- Ninguna --
                        </SelectItem>
                        
                        {ubicacionesData.map((u) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                            {u.nombre}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>

                  <div className="space-y-2">
                    <Label>Estado *</Label>
                    <Select 
                      value={form.estado_atrapaniebla_id} 
                      onValueChange={(val) => setForm(p => ({...p, estado_atrapaniebla_id: val}))}
                      disabled={estadosQuery.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={estadosQuery.isLoading ? "Cargando..." : "Seleccionar"} />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosData.map((e: CatalogoBasico) => (
                          <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Código *</Label>
                    <Input value={form.codigo} onChange={(e) => setForm(p => ({...p, codigo: e.target.value}))} placeholder="AT-001" maxLength={30} />
                  </div>

                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input value={form.nombre} onChange={(e) => setForm(p => ({...p, nombre: e.target.value}))} placeholder="Malla principal" maxLength={100} />
                  </div>

                  <div className="space-y-2">
                    <Label>Área de Malla (m²) *</Label>
                    <Input type="number" step="0.01" value={form.area_malla_m2} onChange={(e) => setForm(p => ({...p, area_malla_m2: e.target.value}))} placeholder="12.5" />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha Instalación</Label>
                    <Input type="date" value={form.fecha_instalacion} onChange={(e) => setForm(p => ({...p, fecha_instalacion: e.target.value}))} />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Malla</Label>
                    <Input value={form.tipo_malla} onChange={(e) => setForm(p => ({...p, tipo_malla: e.target.value}))} placeholder="Raschel 35%" />
                  </div>

                  <div className="space-y-2">
                    <Label>Orientación</Label>
                    <Input value={form.orientacion} onChange={(e) => setForm(p => ({...p, orientacion: e.target.value}))} placeholder="Sur-Oeste" />
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
          placeholder="Buscar código o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.map((item) => {
            const ubi = ubicacionesData.find(u => u.id === item.ubicacion_id)
            const est = estadosData.find(e => e.id === item.estado_atrapaniebla_id)
            
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.codigo}</TableCell>
                <TableCell>{item.nombre}</TableCell>
                <TableCell>{ubi ? ubi.nombre : `ID: ${item.ubicacion_id}`}</TableCell>
                <TableCell>{item.area_malla_m2} m²</TableCell>
                <TableCell>{est ? est.nombre : `ID: ${item.estado_atrapaniebla_id}`}</TableCell>
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