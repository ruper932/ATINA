import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Pencil, Trash2, Plus, RefreshCw } from 'lucide-react'

import { usersService } from '@/services/users.service'
import type {
  UserCreatePayload,
  UserResponse,
  UserUpdatePayload,
  RolResponse,
  EstadoUsuarioResponse,
} from '@/types/user'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

type FormState = {
  ci: string
  email: string
  username: string
  password: string
  is_active: boolean
  is_superuser: boolean
  rol_id: string
  estado_usuario_id: string
  is_totp_enabled: boolean
  is_email_2fa_enabled: boolean
}

const initialForm: FormState = {
  ci: '',
  email: '',
  username: '',
  password: '',
  is_active: true,
  is_superuser: false,
  rol_id: '',
  estado_usuario_id: '',
  is_totp_enabled: false,
  is_email_2fa_enabled: false,
}

const PAGE_SIZE = 10

export default function UsuariosPage() {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: usersService.getAll,
  })

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: usersService.getRoles,
  })

  const estadosQuery = useQuery({
    queryKey: ['estados-usuario'],
    queryFn: usersService.getEstados,
  })

  const createMutation = useMutation({
    mutationFn: (payload: UserCreatePayload) => usersService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ ci, payload }: { ci: string; payload: UserUpdatePayload }) =>
      usersService.update(ci, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      resetFormAndClose()
    },
    onError: handleMutationError,
  })

  const deleteMutation = useMutation({
    mutationFn: (ci: string) => usersService.remove(ci),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
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
    setEditingUser(null)
    setApiError(null)
    setOpen(false)
  }

  function openCreateModal() {
    setEditingUser(null)
    setForm(initialForm)
    setApiError(null)
    setOpen(true)
  }

  function openEditModal(user: UserResponse) {
    setEditingUser(user)
    setForm({
      ci: user.ci,
      email: user.email,
      username: user.username,
      password: '',
      is_active: user.is_active,
      is_superuser: user.is_superuser,
      rol_id: user.rol_id ? String(user.rol_id) : '',
      estado_usuario_id: user.estado_usuario_id ? String(user.estado_usuario_id) : '',
      is_totp_enabled: user.is_totp_enabled,
      is_email_2fa_enabled: user.is_email_2fa_enabled,
    })
    setApiError(null)
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    if (!form.ci || !form.email || !form.username || !form.rol_id || !form.estado_usuario_id) {
      setApiError('Completa todos los campos obligatorios.')
      return
    }

    if (!editingUser && !form.password.trim()) {
      setApiError('La contraseña es obligatoria al crear un usuario.')
      return
    }

    if (editingUser) {
      const payload: UserUpdatePayload = {
        email: form.email,
        username: form.username,
        is_active: form.is_active,
        is_superuser: form.is_superuser,
        rol_id: Number(form.rol_id),
        estado_usuario_id: Number(form.estado_usuario_id),
        is_totp_enabled: form.is_totp_enabled,
        is_email_2fa_enabled: form.is_email_2fa_enabled,
      }

      if (form.password.trim()) {
        payload.password = form.password
      }

      updateMutation.mutate({ ci: editingUser.ci, payload })
      return
    }

    const payload: UserCreatePayload = {
      ci: form.ci,
      email: form.email,
      username: form.username,
      password: form.password,
      is_active: form.is_active,
      is_superuser: form.is_superuser,
      rol_id: Number(form.rol_id),
      estado_usuario_id: Number(form.estado_usuario_id),
      is_totp_enabled: form.is_totp_enabled,
      is_email_2fa_enabled: form.is_email_2fa_enabled,
    }

    createMutation.mutate(payload)
  }

  const filteredUsers = useMemo(() => {
    const items = usersQuery.data ?? []
    const term = search.toLowerCase().trim()

    if (!term) return items

    return items.filter(
      (user) =>
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.ci.toLowerCase().includes(term)
    )
  }, [usersQuery.data, search])

  useEffect(() => {
    setPage(1)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, page])

  const rolesMap = useMemo(() => {
    const map = new Map<number, string>()
    ;(rolesQuery.data ?? []).forEach((role: RolResponse) => {
      map.set(role.id, role.nombre)
    })
    return map
  }, [rolesQuery.data])

  const estadosMap = useMemo(() => {
    const map = new Map<number, string>()
    ;(estadosQuery.data ?? []).forEach((estado: EstadoUsuarioResponse) => {
      map.set(estado.id, estado.nombre)
    })
    return map
  }, [estadosQuery.data])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona usuarios, roles, estados y factores de autenticación.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['users'] })
              queryClient.invalidateQueries({ queryKey: ['roles'] })
              queryClient.invalidateQueries({ queryKey: ['estados-usuario'] })
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
                Nuevo usuario
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Editar usuario' : 'Crear usuario'}</DialogTitle>
                <DialogDescription>
                  Completa los datos requeridos del usuario.
                </DialogDescription>
              </DialogHeader>

              {(rolesQuery.error || estadosQuery.error) && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  No se pudieron cargar roles o estados.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ci">CI</Label>
                    <Input
                      id="ci"
                      value={form.ci}
                      onChange={(e) => setForm((prev) => ({ ...prev, ci: e.target.value }))}
                      placeholder="1234567"
                      disabled={!!editingUser}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="usuario@atina.bo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Usuario</Label>
                    <Input
                      id="username"
                      value={form.username}
                      onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                      placeholder="jperez"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="password">
                      {editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <Select
                      value={form.rol_id}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, rol_id: value }))}
                      disabled={rolesQuery.isLoading || !!rolesQuery.error}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            rolesQuery.isLoading
                              ? 'Cargando roles...'
                              : rolesQuery.error
                                ? 'No se pudieron cargar'
                                : 'Selecciona un rol'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(rolesQuery.data ?? []).map((role) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {role.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={form.estado_usuario_id}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, estado_usuario_id: value }))
                      }
                      disabled={estadosQuery.isLoading || !!estadosQuery.error}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            estadosQuery.isLoading
                              ? 'Cargando estados...'
                              : estadosQuery.error
                                ? 'No se pudieron cargar'
                                : 'Selecciona un estado'
                          }
                        />
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
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-md border p-3">
                    <Checkbox
                      checked={form.is_active}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, is_active: checked === true }))
                      }
                    />
                    <span className="text-sm">Usuario activo</span>
                  </label>

                  <label className="flex items-center gap-3 rounded-md border p-3">
                    <Checkbox
                      checked={form.is_superuser}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, is_superuser: checked === true }))
                      }
                    />
                    <span className="text-sm">Superusuario</span>
                  </label>

                  <label className="flex items-center gap-3 rounded-md border p-3">
                    <Checkbox
                      checked={form.is_totp_enabled}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, is_totp_enabled: checked === true }))
                      }
                    />
                    <span className="text-sm">2FA con TOTP habilitado</span>
                  </label>

                  <label className="flex items-center gap-3 rounded-md border p-3">
                    <Checkbox
                      checked={form.is_email_2fa_enabled}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          is_email_2fa_enabled: checked === true,
                        }))
                      }
                    />
                    <span className="text-sm">2FA por correo habilitado</span>
                  </label>
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
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      rolesQuery.isLoading ||
                      estadosQuery.isLoading ||
                      !!rolesQuery.error ||
                      !!estadosQuery.error
                    }
                  >
                    {isSubmitting ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(usersQuery.error || rolesQuery.error || estadosQuery.error) && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          Error al cargar datos del módulo de usuarios.
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por CI, usuario o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:max-w-sm"
        />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CI</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead>2FA</TableHead>
              <TableHead>Último acceso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {usersQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={9}>Cargando usuarios...</TableCell>
              </TableRow>
            ) : paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>No se encontraron usuarios.</TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.ci}>
                  <TableCell>{user.ci}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.rol_id ? rolesMap.get(user.rol_id) ?? `Rol #${user.rol_id}` : '—'}
                  </TableCell>
                  <TableCell>
                    {user.estado_usuario_id
                      ? estadosMap.get(user.estado_usuario_id) ?? `Estado #${user.estado_usuario_id}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.is_totp_enabled || user.is_email_2fa_enabled ? 'Sí' : 'No'}
                  </TableCell>
                  <TableCell>
                    {user.ultimo_acceso ? new Date(user.ultimo_acceso).toLocaleString() : 'Nunca'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEditModal(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar al usuario ${user.username}?`)) {
                            deleteMutation.mutate(user.ci)
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

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredUsers.length)} de{' '}
          {filteredUsers.length} usuarios
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <Button variant="outline" disabled>
            Página {page} de {totalPages}
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}