import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Pencil, Plus, RefreshCw, Search, ShieldCheck, Users, FileText } from 'lucide-react'

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type FormState = {
  nombre: string
  descripcion: string
}

const initialForm: FormState = {
  nombre: '',
  descripcion: '',
}

type MetricTone = 'emerald' | 'teal' | 'amber' | 'rose' | 'blue' | 'violet'

type StatCard = {
  title: string
  value: string
  helper: string
  icon: React.ElementType
  tone: MetricTone
}

const toneMap = {
  emerald:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300',
  teal:
    'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/40 dark:bg-teal-950/20 dark:text-teal-300',
  amber:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300',
  rose:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300',
  blue:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300',
  violet:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-300',
}

function MetricCard({ item }: { item: StatCard }) {
  const Icon = item.icon

  return (
    <Card className="h-full rounded-[24px] border border-border/70 bg-card shadow-none transition-all hover:border-primary/30 hover:bg-accent/30">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-2">
          <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {item.title}
          </CardDescription>
          <CardTitle className="text-4xl font-bold tracking-tight text-foreground">
            {item.value}
          </CardTitle>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${toneMap[item.tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm leading-6 text-muted-foreground">{item.helper}</p>
      </CardContent>
    </Card>
  )
}

function SurfaceCard({
  title,
  description,
  children,
  action,
  className = '',
}: {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`rounded-[24px] border border-border/70 bg-card shadow-none ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1 text-sm leading-6">{description}</CardDescription>
            )}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
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

  const totalRoles = rolesQuery.data?.length ?? 0
  const rolesConDescripcion = (rolesQuery.data ?? []).filter(
    (role) => (role.descripcion ?? '').trim().length > 0
  ).length
  const rolesSinDescripcion = totalRoles - rolesConDescripcion

  const stats: StatCard[] = [
    {
      title: 'Roles',
      value: String(totalRoles),
      helper: 'Roles disponibles en el sistema',
      icon: Users,
      tone: 'emerald',
    },
    {
      title: 'Con descripción',
      value: String(rolesConDescripcion),
      helper: 'Roles documentados para administración',
      icon: FileText,
      tone: 'teal',
    },
    {
      title: 'Sin descripción',
      value: String(rolesSinDescripcion),
      helper: 'Roles que requieren contexto adicional',
      icon: ShieldCheck,
      tone: 'amber',
    },
  ]

  return (
    <div className="min-h-full space-y-6 bg-background">
      <section className="rounded-[28px] border border-border/70 bg-card px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
            >
              Administración de accesos
            </Badge>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Roles
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              Administra los roles disponibles para los usuarios del sistema.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-2xl"
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
                <Button
                  onClick={openCreateModal}
                  className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo rol
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-lg rounded-[28px] border border-border/70 bg-card">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-foreground">
                    {editingRole ? 'Editar rol' : 'Crear rol'}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-6">
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
                      className="rounded-2xl border-border/70 bg-background"
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
                      className="min-h-[110px] rounded-2xl border-border/70 bg-background"
                    />
                  </div>

                  {apiError && (
                    <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400">
                      {apiError}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetFormAndClose}
                      className="rounded-2xl"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {isSubmitting ? 'Guardando...' : editingRole ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <MetricCard key={item.title} item={item} />
        ))}
      </section>

      {rolesQuery.error && (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/30 dark:bg-rose-950/20">
          <h2 className="text-lg font-semibold text-rose-700 dark:text-rose-300">
            No se pudieron cargar los roles
          </h2>
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
            Revisa la conectividad con la API o los permisos del módulo.
          </p>
        </div>
      )}

      <SurfaceCard
        title="Listado de roles"
        description="Busca por id, nombre o descripción y administra cada registro."
        action={
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por id, nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-2xl border-border/70 bg-background pl-9"
            />
          </div>
        }
      >
        <div className="overflow-hidden rounded-[22px] border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/70 bg-muted/40">
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  ID
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Nombre
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Descripción
                </TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rolesQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Cargando roles...
                  </TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No se encontraron roles.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow
                    key={role.id}
                    className="border-b border-border/70 transition-colors hover:bg-accent/30"
                  >
                    <TableCell className="font-medium text-foreground">{role.id}</TableCell>
                    <TableCell className="font-semibold text-foreground">{role.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.descripcion || 'Sin descripción'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-2xl"
                        onClick={() => openEditModal(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SurfaceCard>
    </div>
  )
}