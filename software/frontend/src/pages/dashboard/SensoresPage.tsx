import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

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

export default function SensoresPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SensorResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  // --- QUERIES ---
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

  // --- MUTATIONS ---
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

    // 1. Validar campos obligatorios de forma estricta
    if (
      !form.dispositivo_id || form.dispositivo_id === '' ||
      !form.tipo_sensor_id || form.tipo_sensor_id === '' ||
      !form.estado_sensor_id || form.estado_sensor_id === '' ||
      !form.codigo.trim() ||
      !form.nombre.trim()
    ) {
      setApiError('Completa todos los campos obligatorios marcados con *.')
      return
    }

    // 2. Parsear el payload garantizando los tipos de datos que espera FastAPI
    const payloadBase: SensorCreatePayload = {
      dispositivo_id: parseInt(form.dispositivo_id, 10),
      tipo_sensor_id: parseInt(form.tipo_sensor_id, 10),
      estado_sensor_id: parseInt(form.estado_sensor_id, 10),
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      modelo: form.modelo.trim() === '' ? null : form.modelo.trim(),
      numero_serie: form.numero_serie.trim() === '' ? null : form.numero_serie.trim(),
      // Convertimos explícitamente a Number si existe, sino null
      precision_valor: form.precision_valor.trim() === '' ? null : Number(form.precision_valor),
      fecha_instalacion: form.fecha_instalacion === '' ? null : form.fecha_instalacion,
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload: payloadBase })
    } else {
      createMutation.mutate(payloadBase)
    }
  }

  // --- FILTROS ---
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sensores</h1>
          <p className="text-muted-foreground">
            Gestiona los sensores conectados a los dispositivos.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
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
              <Button onClick={openCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo sensor
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Editar sensor' : 'Crear sensor'}
                </DialogTitle>
                <DialogDescription>
                  Completa los datos técnicos del sensor.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  
                  {/* SELECT DISPOSITIVO */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="dispositivo_id">Dispositivo de conexión *</Label>
                    <Select
                      value={form.dispositivo_id}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, dispositivo_id: value }))}
                      disabled={dispositivosQuery.isLoading || dispositivosQuery.isError}
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            dispositivosQuery.isLoading ? "Cargando dispositivos..." : "Selecciona un dispositivo"
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
                    />
                  </div>

                  {/* SELECT TIPO DE SENSOR */}
                  <div className="space-y-2">
                    <Label htmlFor="tipo_sensor_id">Tipo de Sensor *</Label>
                    <Select
                      value={form.tipo_sensor_id}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, tipo_sensor_id: value }))}
                      disabled={tiposSensorQuery.isLoading || tiposSensorQuery.isError}
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            tiposSensorQuery.isLoading ? "Cargando..." : "Selecciona un tipo"
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

                  {/* SELECT ESTADO DE SENSOR */}
                  <div className="space-y-2">
                    <Label htmlFor="estado_sensor_id">Estado del Sensor *</Label>
                    <Select
                      value={form.estado_sensor_id}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, estado_sensor_id: value }))}
                      disabled={estadosSensorQuery.isLoading || estadosSensorQuery.isError}
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            estadosSensorQuery.isLoading ? "Cargando..." : "Selecciona un estado"
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero_serie">Número de Serie</Label>
                    <Input
                      id="numero_serie"
                      value={form.numero_serie}
                      onChange={(e) => setForm((prev) => ({ ...prev, numero_serie: e.target.value }))}
                      placeholder="SN-12345"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="precision_valor">Precisión de lectura</Label>
                    <Input
                      id="precision_valor"
                      type="number"
                      step="0.0001"
                      value={form.precision_valor}
                      onChange={(e) => setForm((prev) => ({ ...prev, precision_valor: e.target.value }))}
                      placeholder="0.05"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha_instalacion">Fecha de Instalación</Label>
                    <Input
                      id="fecha_instalacion"
                      type="date"
                      value={form.fecha_instalacion}
                      onChange={(e) => setForm((prev) => ({ ...prev, fecha_instalacion: e.target.value }))}
                    />
                  </div>

                </div>

                {apiError && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {apiError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
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
          placeholder="Buscar por código o nombre..."
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
              <TableHead>Dispositivo (Host)</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Instalado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sensoresQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={8}>Cargando sensores...</TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>No se encontraron sensores.</TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const tipo = tiposSensorQuery.data?.find((t) => t.id === item.tipo_sensor_id)
                const estado = estadosSensorQuery.data?.find((e) => e.id === item.estado_sensor_id)
                const dispositivo = dispositivosQuery.data?.find((d) => d.id === item.dispositivo_id)

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.codigo}</TableCell>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>{dispositivo ? dispositivo.nombre : item.dispositivo_id}</TableCell>
                    <TableCell>{tipo ? tipo.nombre : item.tipo_sensor_id}</TableCell>
                    <TableCell>{estado ? estado.nombre : item.estado_sensor_id}</TableCell>
                    <TableCell>{item.modelo || '-'}</TableCell>
                    <TableCell>{item.fecha_instalacion || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditModal(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="destructive"
                          size="icon"
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
    </div>
  )
}