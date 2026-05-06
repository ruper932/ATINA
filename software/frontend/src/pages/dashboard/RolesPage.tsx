import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Pencil, Plus, RefreshCw } from 'lucide-react'

import { rolesService } from '@/services/roles.service'
import type { RolCreatePayload, RolResponse, RolUpdatePayload } from '@/types/user'

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

type FormState = {
  nombre: string
  descripcion: string
}

const initialForm: FormState = {
  nombre: '',
  descripcion: '',
}

export default function RolesPage() {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RolResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const rolesQuery = useQuery({
    queryKey: ['roles-admin'],
    queryFn: rolesService.getAll,
  })

  const createMutation = useMutation({
    mutationFn: (payload: RolCreatePayload) => rolesService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles-admin'] })
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RolUpdatePayload }) =>
      rolesService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles-admin'] })
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  function handleMutationError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail
      setApiError(typeof detail === 'string' ? detail : 'Ocurrió un error al guardar el rol.')
    } else {
      setApiError('Ocurrió un error inesperado.')
    }
  }

  function resetFormAndClose() {
    setForm(initialForm)
    setEditingRole(null)
    setApiError(null)
    setOpen(false)
  }

  function openCreateModal() {
    setEditingRole(null)
    setForm(initialForm)
    setApiError(null)
    setOpen(true)
  }

  function openEditModal(role: RolResponse) {
    setEditingRole(role)
    setForm({
      nombre: role.nombre,
      descripcion: role.descripcion ?? '',
    })
    setApiError(null)
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    if (!form.nombre.trim()) {
      setApiError('El nombre del rol es obligatorio.')
      return
    }

    if (editingRole) {
      const payload: RolUpdatePayload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
      }

      updateMutation.mutate({ id: editingRole.id, payload })
      return
    }

    const payload: RolCreatePayload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
    }

    createMutation.mutate(payload)
  }

  const filteredRoles = useMemo(() => {
    const items = rolesQuery.data ?? []
    const term = search.toLowerCase().trim()

    if (!term) return items

    return items.filter(
      (role) =>
        role.nombre.toLowerCase().includes(term) ||
        (role.descripcion ?? '').toLowerCase().includes(term) ||
        String(role.id).includes(term)
    )
  }, [rolesQuery.data, search])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roles</h1>
          <p className="text-muted-foreground">
            Administra los roles disponibles para los usuarios del sistema.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['roles-admin'] })}
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
                Nuevo rol
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingRole ? 'Editar rol' : 'Crear rol'}</DialogTitle>
                <DialogDescription>
                  Define el nombre y la descripción del rol.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={form.nombre}
                    onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="admin"
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={form.descripcion}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, descripcion: e.target.value }))
                    }
                    placeholder="Describe el alcance del rol"
                    className="min-h-[110px]"
                  />
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
                    {isSubmitting ? 'Guardando...' : editingRole ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {rolesQuery.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          No se pudieron cargar los roles.
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por id, nombre o descripción..."
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
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rolesQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>Cargando roles...</TableCell>
              </TableRow>
            ) : filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No se encontraron roles.</TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.id}</TableCell>
                  <TableCell className="font-medium">{role.nombre}</TableCell>
                  <TableCell>{role.descripcion || 'Sin descripción'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="icon" onClick={() => openEditModal(role)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
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