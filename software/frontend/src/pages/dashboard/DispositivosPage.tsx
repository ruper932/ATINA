import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

import { dispositivosService } from '@/services/dispositivos.service'
import { catalogosService } from '@/services/catalogos.service'
import type {
  DispositivoCreatePayload,
  DispositivoResponse,
  DispositivoUpdatePayload,
} from '@/types/dispositivo'

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
  tipo_dispositivo_id: string
  codigo: string
  nombre: string
  identificador_local: string
  ip_local: string
  version_firmware: string
  estado_dispositivo_id: string
}

const initialForm: FormState = {
  tipo_dispositivo_id: '',
  codigo: '',
  nombre: '',
  identificador_local: '',
  ip_local: '',
  version_firmware: '',
  estado_dispositivo_id: '',
}

export default function DispositivosPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DispositivoResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  // --- QUERIES ---
  const dispositivosQuery = useQuery({
    queryKey: ['dispositivos'],
    queryFn: dispositivosService.getAll,
  })

  const tiposDispositivoQuery = useQuery({
    queryKey: ['catalogos', 'tipos-dispositivo'],
    queryFn: catalogosService.getTiposDispositivo,
  })

  const estadosDispositivoQuery = useQuery({
    queryKey: ['catalogos', 'estados-dispositivo'],
    queryFn: catalogosService.getEstadosDispositivo,
  })

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: (payload: DispositivoCreatePayload) => dispositivosService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dispositivos'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DispositivoUpdatePayload }) =>
      dispositivosService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dispositivos'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => dispositivosService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dispositivos'] })
    },
    onError: handleMutationError,
  })

  // --- HANDLERS ---
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

  function openEditModal(item: DispositivoResponse) {
    setEditingItem(item)
    setForm({
      tipo_dispositivo_id: String(item.tipo_dispositivo_id),
      codigo: item.codigo,
      nombre: item.nombre,
      identificador_local: item.identificador_local ?? '',
      ip_local: item.ip_local ?? '',
      version_firmware: item.version_firmware ?? '',
      estado_dispositivo_id: String(item.estado_dispositivo_id),
    })
    setApiError(null)
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    if (
      !form.tipo_dispositivo_id ||
      !form.codigo.trim() ||
      !form.nombre.trim() ||
      !form.estado_dispositivo_id
    ) {
      setApiError('Completa todos los campos obligatorios.')
      return
    }

    const payloadBase: DispositivoCreatePayload = {
      tipo_dispositivo_id: Number(form.tipo_dispositivo_id),
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      identificador_local: form.identificador_local.trim() || null,
      ip_local: form.ip_local.trim() || null,
      version_firmware: form.version_firmware.trim() || null,
      estado_dispositivo_id: Number(form.estado_dispositivo_id),
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload: payloadBase })
    } else {
      createMutation.mutate(payloadBase)
    }
  }

  // --- FILTROS ---
  const filteredItems = useMemo(() => {
    const items = dispositivosQuery.data ?? []
    const term = search.toLowerCase().trim()
    if (!term) return items
    return items.filter(
      (item) =>
        String(item.id).includes(term) ||
        item.codigo.toLowerCase().includes(term) ||
        item.nombre.toLowerCase().includes(term) ||
        (item.ip_local && item.ip_local.includes(term))
    )
  }, [dispositivosQuery.data, search])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispositivos</h1>
          <p className="text-muted-foreground">
            Gestiona los dispositivos y controladores del sistema.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['dispositivos'] })
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
              <Button onClick={openCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo dispositivo
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Editar dispositivo' : 'Crear dispositivo'}
                </DialogTitle>
                <DialogDescription>
                  Completa los datos de configuración del dispositivo.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={form.codigo}
                      onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
                      placeholder="DISP-001"
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={form.nombre}
                      onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Controlador Principal"
                      maxLength={100}
                    />
                  </div>

                  {/* SELECT TIPO DE DISPOSITIVO */}
                  <div className="space-y-2">
                    <Label htmlFor="tipo_dispositivo_id">Tipo de Dispositivo *</Label>
                    <Select
                      value={form.tipo_dispositivo_id}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, tipo_dispositivo_id: value }))}
                      disabled={tiposDispositivoQuery.isLoading || tiposDispositivoQuery.isError}
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            tiposDispositivoQuery.isLoading ? "Cargando..." : "Selecciona un tipo"
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposDispositivoQuery.data?.map((tipo) => (
                          <SelectItem key={tipo.id} value={String(tipo.id)}>
                            {tipo.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* SELECT ESTADO DE DISPOSITIVO */}
                  <div className="space-y-2">
                    <Label htmlFor="estado_dispositivo_id">Estado del Dispositivo *</Label>
                    <Select
                      value={form.estado_dispositivo_id}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, estado_dispositivo_id: value }))}
                      disabled={estadosDispositivoQuery.isLoading || estadosDispositivoQuery.isError}
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            estadosDispositivoQuery.isLoading ? "Cargando..." : "Selecciona un estado"
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosDispositivoQuery.data?.map((estado) => (
                          <SelectItem key={estado.id} value={String(estado.id)}>
                            {estado.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="identificador_local">Identificador Local</Label>
                    <Input
                      id="identificador_local"
                      value={form.identificador_local}
                      onChange={(e) => setForm((prev) => ({ ...prev, identificador_local: e.target.value }))}
                      placeholder="ej. ESP32-A1"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ip_local">IP Local</Label>
                    <Input
                      id="ip_local"
                      value={form.ip_local}
                      onChange={(e) => setForm((prev) => ({ ...prev, ip_local: e.target.value }))}
                      placeholder="192.168.1.100"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="version_firmware">Versión Firmware</Label>
                    <Input
                      id="version_firmware"
                      value={form.version_firmware}
                      onChange={(e) => setForm((prev) => ({ ...prev, version_firmware: e.target.value }))}
                      placeholder="v1.2.0"
                      maxLength={50}
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
          placeholder="Buscar por id, código, nombre o IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:max-w-sm"
        />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>IP Local</TableHead>
              <TableHead>Firmware</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {dispositivosQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>Cargando dispositivos...</TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>No se encontraron dispositivos.</TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                // Buscamos los nombres en los catálogos para no mostrar solo el número ID
                const tipo = tiposDispositivoQuery.data?.find((t) => t.id === item.tipo_dispositivo_id)
                const estado = estadosDispositivoQuery.data?.find((e) => e.id === item.estado_dispositivo_id)

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.codigo}</TableCell>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>{tipo ? tipo.nombre : item.tipo_dispositivo_id}</TableCell>
                    <TableCell>{estado ? estado.nombre : item.estado_dispositivo_id}</TableCell>
                    <TableCell>{item.ip_local || '-'}</TableCell>
                    <TableCell>{item.version_firmware || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditModal(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar el dispositivo ${item.codigo}?`)) {
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