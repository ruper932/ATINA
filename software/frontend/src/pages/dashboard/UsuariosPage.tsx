import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Mail,
  UserRound,
  ArrowRight,
  Users,
  Activity,
  UserCog,
  Download,
  AlertCircle,
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import Papa from 'papaparse'

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

type FormErrors = {
  ci?: string
  email?: string
  username?: string
  password?: string
  rol_id?: string
  estado_usuario_id?: string
}

type MetricTone = 'emerald' | 'teal' | 'amber' | 'rose' | 'blue' | 'violet'

type MetricItem = {
  title: string
  value: string
  helper: string
  icon: React.ElementType
  tone: MetricTone
}

type RoleFilterValue = 'all' | string
type AccessFilterValue = 'all' | 'active' | 'inactive'
type TwoFactorFilterValue = 'all' | 'with-2fa' | 'without-2fa'

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

// Expresiones regulares para validaciones
const CI_REGEX = /^\d{6,10}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/
const PASSWORD_REGEX = /^.{6,}$/

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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
      }`}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function SecurityBadge({
  totp,
  email2fa,
}: {
  totp: boolean
  email2fa: boolean
}) {
  if (!totp && !email2fa) {
    return (
      <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        No
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {totp && (
        <span className="inline-flex rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/30 dark:text-teal-300">
          TOTP
        </span>
      )}
      {email2fa && (
        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          Correo
        </span>
      )}
    </div>
  )
}

function MetricCard({ item }: { item: MetricItem }) {
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

      <CardContent className="flex items-center justify-between gap-3 pt-0">
        <p className="text-sm leading-6 text-muted-foreground">{item.helper}</p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground">
          <ArrowRight className="h-4 w-4" />
        </div>
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

function ToggleCard({
  checked,
  onCheckedChange,
  label,
  helper,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  helper?: string
}) {
  return (
    <label className="flex items-start gap-3 rounded-[22px] border border-border/70 bg-background px-4 py-4 transition-colors hover:border-primary/20 hover:bg-accent/20">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      <div className="space-y-1">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {helper && <span className="block text-xs text-muted-foreground">{helper}</span>}
      </div>
    </label>
  )
}

export default function UsuariosPage() {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>('all')
  const [accessFilter, setAccessFilter] = useState<AccessFilterValue>('all')
  const [twoFactorFilter, setTwoFactorFilter] = useState<TwoFactorFilterValue>('all')

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
    setFormErrors({})
    setEditingUser(null)
    setApiError(null)
    setOpen(false)
  }

  function openCreateModal() {
    setEditingUser(null)
    setForm(initialForm)
    setFormErrors({})
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
    setFormErrors({})
    setApiError(null)
    setOpen(true)
  }

  // Función de validación del formulario
  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    let isValid = true

    // Validación de CI (solo para creación, no para edición)
    if (!editingUser) {
      if (!form.ci) {
        errors.ci = 'El CI es obligatorio'
        isValid = false
      } else if (!CI_REGEX.test(form.ci)) {
        errors.ci = 'El CI debe tener entre 6 y 10 dígitos numéricos'
        isValid = false
      }
    }

    // Validación de email
    if (!form.email) {
      errors.email = 'El correo electrónico es obligatorio'
      isValid = false
    } else if (!EMAIL_REGEX.test(form.email)) {
      errors.email = 'Ingrese un correo electrónico válido (ejemplo@dominio.com)'
      isValid = false
    }

    // Validación de username
    if (!form.username) {
      errors.username = 'El nombre de usuario es obligatorio'
      isValid = false
    } else if (!USERNAME_REGEX.test(form.username)) {
      errors.username = 'El nombre de usuario debe tener entre 3 y 30 caracteres (letras, números, guiones o guiones bajos)'
      isValid = false
    }

    // Validación de contraseña (obligatoria para creación, opcional para edición)
    if (!editingUser && !form.password) {
      errors.password = 'La contraseña es obligatoria'
      isValid = false
    } else if (!editingUser && !PASSWORD_REGEX.test(form.password)) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
      isValid = false
    } else if (editingUser && form.password && !PASSWORD_REGEX.test(form.password)) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
      isValid = false
    }

    // Validación de rol
    if (!form.rol_id) {
      errors.rol_id = 'Debe seleccionar un rol'
      isValid = false
    }

    // Validación de estado de usuario
    if (!form.estado_usuario_id) {
      errors.estado_usuario_id = 'Debe seleccionar un estado de acceso'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    // Ejecutar validaciones
    if (!validateForm()) {
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

  const activeEstado = useMemo(() => {
    return (estadosQuery.data ?? []).find((estado) => {
      const nombre = estado.nombre.trim().toLowerCase()
      return nombre === 'activo' || nombre === 'activa' || nombre === 'habilitado'
    })
  }, [estadosQuery.data])

  const inactiveEstado = useMemo(() => {
    return (estadosQuery.data ?? []).find((estado) => {
      const nombre = estado.nombre.trim().toLowerCase()
      return nombre === 'inactivo' || nombre === 'inactiva' || nombre === 'deshabilitado'
    })
  }, [estadosQuery.data])

  const accessStatusValue = useMemo(() => {
    if (activeEstado && form.estado_usuario_id === String(activeEstado.id) && form.is_active) {
      return 'active'
    }

    if (inactiveEstado && form.estado_usuario_id === String(inactiveEstado.id) && !form.is_active) {
      return 'inactive'
    }

    return form.is_active ? 'active' : 'inactive'
  }, [form.estado_usuario_id, form.is_active, activeEstado, inactiveEstado])

  const filteredUsers = useMemo(() => {
    const items = usersQuery.data ?? []
    const term = search.toLowerCase().trim()

    return items.filter((user) => {
      const matchesSearch =
        !term ||
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.ci.toLowerCase().includes(term)

      const matchesRole = roleFilter === 'all' || String(user.rol_id ?? '') === roleFilter

      const matchesAccess =
        accessFilter === 'all' ||
        (accessFilter === 'active' && user.is_active) ||
        (accessFilter === 'inactive' && !user.is_active)

      const has2FA = user.is_totp_enabled || user.is_email_2fa_enabled
      const matches2FA =
        twoFactorFilter === 'all' ||
        (twoFactorFilter === 'with-2fa' && has2FA) ||
        (twoFactorFilter === 'without-2fa' && !has2FA)

      return matchesSearch && matchesRole && matchesAccess && matches2FA
    })
  }, [usersQuery.data, search, roleFilter, accessFilter, twoFactorFilter])

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, accessFilter, twoFactorFilter])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, page])

  const exportRows = useMemo(() => {
    return filteredUsers.map((user) => ({
      CI: user.ci,
      Usuario: user.username,
      Correo: user.email,
      Rol: user.rol_id ? rolesMap.get(user.rol_id) ?? `Rol #${user.rol_id}` : '—',
      Estado: user.estado_usuario_id
        ? estadosMap.get(user.estado_usuario_id) ?? `Estado #${user.estado_usuario_id}`
        : '—',
      Activo: user.is_active ? 'Sí' : 'No',
      Superusuario: user.is_superuser ? 'Sí' : 'No',
      '2FA TOTP': user.is_totp_enabled ? 'Sí' : 'No',
      '2FA Correo': user.is_email_2fa_enabled ? 'Sí' : 'No',
      'Último acceso': user.ultimo_acceso ? new Date(user.ultimo_acceso).toLocaleString() : 'Nunca',
    }))
  }, [filteredUsers, rolesMap, estadosMap])

  function downloadBlob(content: BlobPart, fileName: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleExportCSV() {
    const csv = Papa.unparse(exportRows)
    downloadBlob(csv, 'usuarios-filtrados.csv', 'text/csv;charset=utf-8;')
  }

  async function handleExportExcel() {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Usuarios')

    worksheet.columns = [
      { header: 'CI', key: 'CI', width: 16 },
      { header: 'Usuario', key: 'Usuario', width: 22 },
      { header: 'Correo', key: 'Correo', width: 32 },
      { header: 'Rol', key: 'Rol', width: 20 },
      { header: 'Estado', key: 'Estado', width: 20 },
      { header: 'Activo', key: 'Activo', width: 12 },
      { header: 'Superusuario', key: 'Superusuario', width: 16 },
      { header: '2FA TOTP', key: '2FA TOTP', width: 14 },
      { header: '2FA Correo', key: '2FA Correo', width: 16 },
      { header: 'Último acceso', key: 'Último acceso', width: 24 },
    ]

    exportRows.forEach((row) => {
      worksheet.addRow(row)
    })

    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '10B981' },
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

    worksheet.eachRow((row, rowNumber) => {
      row.alignment = { vertical: 'middle' }

      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'E5E7EB' } },
            left: { style: 'thin', color: { argb: 'E5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
            right: { style: 'thin', color: { argb: 'E5E7EB' } },
          }
        })
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()

    downloadBlob(
      buffer,
      'usuarios-filtrados.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
  }

  function handleExportPDF() {
    const doc = new jsPDF('landscape', 'pt', 'a4')
    doc.setFontSize(16)
    doc.text('Usuarios filtrados', 40, 30)

    autoTable(doc, {
      startY: 50,
      head: [[
        'CI',
        'Usuario',
        'Correo',
        'Rol',
        'Estado',
        'Activo',
        'Superusuario',
        '2FA TOTP',
        '2FA Correo',
        'Último acceso',
      ]],
      body: exportRows.map((row) => [
        row.CI,
        row.Usuario,
        row.Correo,
        row.Rol,
        row.Estado,
        row.Activo,
        row.Superusuario,
        row['2FA TOTP'],
        row['2FA Correo'],
        row['Último acceso'],
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [16, 185, 129],
      },
    })

    doc.save('usuarios-filtrados.pdf')
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const totalUsers = usersQuery.data?.length ?? 0
  const activeUsers = (usersQuery.data ?? []).filter((user) => user.is_active).length
  const with2FA = (usersQuery.data ?? []).filter(
    (user) => user.is_totp_enabled || user.is_email_2fa_enabled
  ).length
  const superusers = (usersQuery.data ?? []).filter((user) => user.is_superuser).length

  const metrics: MetricItem[] = [
    {
      title: 'Usuarios',
      value: String(totalUsers),
      helper: 'Registros totales en el sistema',
      icon: Users,
      tone: 'emerald',
    },
    {
      title: 'Activos',
      value: String(activeUsers),
      helper: 'Usuarios habilitados para operar',
      icon: Activity,
      tone: 'teal',
    },
    {
      title: 'Con 2FA',
      value: String(with2FA),
      helper: 'TOTP o correo habilitado',
      icon: ShieldCheck,
      tone: 'amber',
    },
    {
      title: 'Superusuarios',
      value: String(superusers),
      helper: 'Perfiles con privilegios elevados',
      icon: UserCog,
      tone: 'violet',
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
              Administración
            </Badge>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Gestión de usuarios
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              Gestiona accesos, roles, estados y factores de autenticación desde una vista centralizada del sistema.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['users'] })
                queryClient.invalidateQueries({ queryKey: ['roles'] })
                queryClient.invalidateQueries({ queryKey: ['estados-usuario'] })
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar
            </Button>

            <Button variant="outline" className="rounded-2xl" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>

            <Button variant="outline" className="rounded-2xl" onClick={handleExportExcel}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>

            <Button variant="outline" className="rounded-2xl" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF
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
                  Nuevo usuario
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] border border-border/70 bg-card sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-foreground">
                    {editingUser ? 'Editar usuario' : 'Crear usuario'}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Completa los datos requeridos del usuario.
                  </DialogDescription>
                </DialogHeader>

                {(rolesQuery.error || estadosQuery.error) && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
                    No se pudieron cargar roles o estados.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ci" className={formErrors.ci ? 'text-rose-600' : ''}>
                        CI {!editingUser && '*'}
                      </Label>
                      <Input
                        id="ci"
                        value={form.ci}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, ci: e.target.value }))
                          if (formErrors.ci) setFormErrors((prev) => ({ ...prev, ci: undefined }))
                        }}
                        placeholder="1234567"
                        disabled={!!editingUser}
                        className={`rounded-2xl border-border/70 bg-background ${formErrors.ci ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                      />
                      {formErrors.ci && (
                        <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {formErrors.ci}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className={formErrors.email ? 'text-rose-600' : ''}>
                        Correo *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, email: e.target.value }))
                          if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }))
                        }}
                        placeholder="usuario@atina.bo"
                        className={`rounded-2xl border-border/70 bg-background ${formErrors.email ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                      />
                      {formErrors.email && (
                        <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className={formErrors.username ? 'text-rose-600' : ''}>
                        Usuario *
                      </Label>
                      <Input
                        id="username"
                        value={form.username}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, username: e.target.value }))
                          if (formErrors.username) setFormErrors((prev) => ({ ...prev, username: undefined }))
                        }}
                        placeholder="jperez"
                        className={`rounded-2xl border-border/70 bg-background ${formErrors.username ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                      />
                      {formErrors.username && (
                        <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {formErrors.username}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="password" className={formErrors.password ? 'text-rose-600' : ''}>
                        {editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, password: e.target.value }))
                          if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: undefined }))
                        }}
                        placeholder="Mínimo 6 caracteres"
                        className={`rounded-2xl border-border/70 bg-background ${formErrors.password ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                      />
                      {formErrors.password && (
                        <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {formErrors.password}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className={formErrors.rol_id ? 'text-rose-600' : ''}>
                        Rol *
                      </Label>
                      <Select
                        value={form.rol_id}
                        onValueChange={(value) => {
                          setForm((prev) => ({ ...prev, rol_id: value }))
                          if (formErrors.rol_id) setFormErrors((prev) => ({ ...prev, rol_id: undefined }))
                        }}
                        disabled={rolesQuery.isLoading || !!rolesQuery.error}
                      >
                        <SelectTrigger className={`rounded-2xl border-border/70 bg-background ${formErrors.rol_id ? 'border-rose-500' : ''}`}>
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
                      {formErrors.rol_id && (
                        <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {formErrors.rol_id}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className={formErrors.estado_usuario_id ? 'text-rose-600' : ''}>
                        Estado de acceso *
                      </Label>
                      <Select
                        value={accessStatusValue}
                        onValueChange={(value) => {
                          if (value === 'active') {
                            setForm((prev) => ({
                              ...prev,
                              is_active: true,
                              estado_usuario_id: activeEstado
                                ? String(activeEstado.id)
                                : prev.estado_usuario_id,
                            }))
                          } else {
                            setForm((prev) => ({
                              ...prev,
                              is_active: false,
                              estado_usuario_id: inactiveEstado
                                ? String(inactiveEstado.id)
                                : prev.estado_usuario_id,
                            }))
                          }
                          if (formErrors.estado_usuario_id) {
                            setFormErrors((prev) => ({ ...prev, estado_usuario_id: undefined }))
                          }
                        }}
                        disabled={
                          estadosQuery.isLoading ||
                          !!estadosQuery.error ||
                          !activeEstado ||
                          !inactiveEstado
                        }
                      >
                        <SelectTrigger className={`rounded-2xl border-border/70 bg-background ${formErrors.estado_usuario_id ? 'border-rose-500' : ''}`}>
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
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.estado_usuario_id && (
                        <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {formErrors.estado_usuario_id}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <ToggleCard
                      checked={form.is_totp_enabled}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, is_totp_enabled: checked }))
                      }
                      label="2FA con TOTP habilitado"
                      helper="Segundo factor mediante app autenticadora."
                    />

                    <ToggleCard
                      checked={form.is_email_2fa_enabled}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, is_email_2fa_enabled: checked }))
                      }
                      label="2FA por correo habilitado"
                      helper="Segundo factor mediante código enviado al correo."
                    />
                  </div>

                  {apiError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
                      {apiError}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
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
                      disabled={
                        isSubmitting ||
                        rolesQuery.isLoading ||
                        estadosQuery.isLoading ||
                        !!rolesQuery.error ||
                        !!estadosQuery.error ||
                        !activeEstado ||
                        !inactiveEstado
                      }
                      className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {isSubmitting ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <MetricCard key={item.title} item={item} />
        ))}
      </section>

      {(usersQuery.error || rolesQuery.error || estadosQuery.error) && (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
          Error al cargar datos del módulo de usuarios.
        </div>
      )}

      <SurfaceCard
        title="Listado de usuarios"
        description="Busca por CI, usuario o correo, filtra en tiempo real y exporta la vista actual."
        action={
          <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative w-full xl:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por CI, usuario o correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-2xl border-border/70 bg-background pl-9"
              />
            </div>

            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value)}>
              <SelectTrigger className="h-11 w-full rounded-2xl border-border/70 bg-background xl:w-52">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {(rolesQuery.data ?? []).map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={accessFilter} onValueChange={(value: AccessFilterValue) => setAccessFilter(value)}>
              <SelectTrigger className="h-11 w-full rounded-2xl border-border/70 bg-background xl:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={twoFactorFilter} onValueChange={(value: TwoFactorFilterValue) => setTwoFactorFilter(value)}>
              <SelectTrigger className="h-11 w-full rounded-2xl border-border/70 bg-background xl:w-44">
                <SelectValue placeholder="2FA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with-2fa">Con 2FA</SelectItem>
                <SelectItem value="without-2fa">Sin 2FA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full">
            Resultados: {filteredUsers.length}
          </Badge>
          <Button variant="outline" className="rounded-2xl" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/70 bg-muted/40">
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
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow
                    key={user.ci}
                    className="border-b border-border/70 transition-colors hover:bg-accent/30"
                  >
                    <TableCell className="font-medium text-foreground">{user.ci}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-foreground">{user.username}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {user.rol_id ? rolesMap.get(user.rol_id) ?? `Rol #${user.rol_id}` : '—'}
                    </TableCell>

                    <TableCell>
                      {user.estado_usuario_id
                        ? estadosMap.get(user.estado_usuario_id) ?? `Estado #${user.estado_usuario_id}`
                        : '—'}
                    </TableCell>

                    <TableCell>
                      <StatusBadge active={user.is_active} />
                    </TableCell>

                    <TableCell>
                      <SecurityBadge
                        totp={user.is_totp_enabled}
                        email2fa={user.is_email_2fa_enabled}
                      />
                    </TableCell>

                    <TableCell>
                      {user.ultimo_acceso ? new Date(user.ultimo_acceso).toLocaleString() : 'Nunca'}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-2xl"
                          onClick={() => openEditModal(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="destructive"
                          size="icon"
                          className="rounded-2xl"
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
      </SurfaceCard>

      <SurfaceCard title="Paginación" description="Navega por el listado completo de usuarios.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredUsers.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, filteredUsers.length)} de {filteredUsers.length} usuarios
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button variant="outline" className="rounded-2xl" disabled>
              Página {page} de {totalPages}
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}