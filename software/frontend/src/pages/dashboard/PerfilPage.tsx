import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  KeyRound,
  RefreshCw,
  Save,
  Shield,
  UserCircle2,
  Copy,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

import { perfilService } from '@/services/perfil.service'
import type {
  PerfilPasswordPayload,
  PerfilUpdatePayload,
  SetupTOTPResponse,
} from '@/types/perfil'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type PerfilFormState = {
  email: string
  username: string
  password_actual: string
}

type PasswordFormState = {
  password_actual: string
  password_nueva: string
  confirmar_password: string
}

type TotpEnableFormState = {
  code: string
}

type TotpDisableFormState = {
  password: string
  code: string
}

const initialPerfilForm: PerfilFormState = {
  email: '',
  username: '',
  password_actual: '',
}

const initialPasswordForm: PasswordFormState = {
  password_actual: '',
  password_nueva: '',
  confirmar_password: '',
}

const initialEnableTotpForm: TotpEnableFormState = {
  code: '',
}

const initialDisableTotpForm: TotpDisableFormState = {
  password: '',
  code: '',
}

function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'info'
}) {
  const toneClasses = {
    neutral: 'border-border/70 bg-background text-foreground',
    success:
      'border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300',
    warning: 'border-border/70 bg-muted/50 text-muted-foreground dark:bg-muted/30',
    info: 'border-border/70 bg-muted/50 text-foreground dark:bg-muted/30',
  }[tone]

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${toneClasses}`}
    >
      {children}
    </span>
  )
}

function AlertBox({
  message,
  tone = 'error',
}: {
  message: string
  tone?: 'error' | 'success'
}) {
  const classes =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'

  return <div className={`rounded-2xl border p-4 text-sm ${classes}`}>{message}</div>
}

function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted ${className}`} />
}

function ReadonlyInfoBlock({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="space-y-1 rounded-2xl border border-border/70 bg-background p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
  describedBy,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  show: boolean
  onToggle: () => void
  describedBy?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={describedBy}
          className="pr-12"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export default function PerfilPage() {
  const queryClient = useQueryClient()

  const [perfilForm, setPerfilForm] = useState<PerfilFormState>(initialPerfilForm)
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(initialPasswordForm)
  const [enableTotpForm, setEnableTotpForm] = useState<TotpEnableFormState>(initialEnableTotpForm)
  const [disableTotpForm, setDisableTotpForm] = useState<TotpDisableFormState>(initialDisableTotpForm)

  const [apiError, setApiError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [totpError, setTotpError] = useState<string | null>(null)

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [totpSuccess, setTotpSuccess] = useState<string | null>(null)

  const [totpSetup, setTotpSetup] = useState<SetupTOTPResponse | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedUri, setCopiedUri] = useState(false)
  const [isTotpModalOpen, setIsTotpModalOpen] = useState(false)

  const [showPerfilPassword, setShowPerfilPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showDisableTotpPassword, setShowDisableTotpPassword] = useState(false)

  const perfilQuery = useQuery({
    queryKey: ['mi-perfil'],
    queryFn: perfilService.getMe,
  })

  const perfil = perfilQuery.data

  useEffect(() => {
    if (perfil) {
      setPerfilForm({
        email: perfil.email,
        username: perfil.username,
        password_actual: '',
      })
    }
  }, [perfil])

  function handlePerfilError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail
      setApiError(typeof detail === 'string' ? detail : 'No se pudo actualizar el perfil.')
    } else {
      setApiError('Ocurrió un error inesperado.')
    }
  }

  function handlePasswordError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail
      setPasswordError(typeof detail === 'string' ? detail : 'No se pudo cambiar la contraseña.')
    } else {
      setPasswordError('Ocurrió un error inesperado.')
    }
  }

  function handleTotpError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail
      setTotpError(typeof detail === 'string' ? detail : 'No se pudo actualizar la configuración 2FA.')
    } else {
      setTotpError('Ocurrió un error inesperado.')
    }
  }

  const updatePerfilMutation = useMutation({
    mutationFn: (payload: PerfilUpdatePayload) => perfilService.updateMe(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mi-perfil'] })
      setApiError(null)
      setSuccessMessage('Perfil actualizado correctamente.')
      setPerfilForm((prev) => ({
        ...prev,
        password_actual: '',
      }))
    },
    onError: handlePerfilError,
  })

  const changePasswordMutation = useMutation({
    mutationFn: (payload: PerfilPasswordPayload) => perfilService.changePassword(payload),
    onSuccess: () => {
      setPasswordForm(initialPasswordForm)
      setPasswordError(null)
      setPasswordSuccess('Contraseña actualizada correctamente.')
    },
    onError: handlePasswordError,
  })

  const setupTotpMutation = useMutation({
    mutationFn: perfilService.setupTOTP,
    onSuccess: (data) => {
      setTotpSetup(data)
      setEnableTotpForm(initialEnableTotpForm)
      setTotpError(null)
      setTotpSuccess(null)
    },
    onError: handleTotpError,
  })

  const enableTotpMutation = useMutation({
    mutationFn: (code: string) => perfilService.enableTOTP(code),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mi-perfil'] })
      setEnableTotpForm(initialEnableTotpForm)
      setTotpSetup(null)
      setTotpError(null)
      setTotpSuccess('TOTP habilitado correctamente.')
      setIsTotpModalOpen(false)
    },
    onError: handleTotpError,
  })

  const disableTotpMutation = useMutation({
    mutationFn: perfilService.disableTOTP,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mi-perfil'] })
      setDisableTotpForm(initialDisableTotpForm)
      setTotpSetup(null)
      setTotpError(null)
      setTotpSuccess('TOTP deshabilitado correctamente.')
    },
    onError: handleTotpError,
  })

  async function copyToClipboard(value: string, kind: 'secret' | 'uri') {
    try {
      await navigator.clipboard.writeText(value)
      if (kind === 'secret') {
        setCopiedSecret(true)
        setTimeout(() => setCopiedSecret(false), 1500)
      } else {
        setCopiedUri(true)
        setTimeout(() => setCopiedUri(false), 1500)
      }
    } catch {
      setTotpError('No se pudo copiar al portapapeles.')
    }
  }

  function openTotpModal() {
    setTotpError(null)
    setTotpSuccess(null)
    setTotpSetup(null)
    setEnableTotpForm(initialEnableTotpForm)
    setCopiedSecret(false)
    setCopiedUri(false)
    setIsTotpModalOpen(true)
    setupTotpMutation.mutate()
  }

  function closeTotpModal() {
    if (setupTotpMutation.isPending || enableTotpMutation.isPending) return
    setIsTotpModalOpen(false)
    setTotpError(null)
    setTotpSuccess(null)
    setTotpSetup(null)
    setEnableTotpForm(initialEnableTotpForm)
    setCopiedSecret(false)
    setCopiedUri(false)
  }

  function handleSubmitPerfil(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)
    setSuccessMessage(null)

    if (!perfilForm.email.trim() || !perfilForm.username.trim() || !perfilForm.password_actual.trim()) {
      setApiError('Correo, usuario y contraseña actual son obligatorios.')
      return
    }

    updatePerfilMutation.mutate({
      email: perfilForm.email.trim(),
      username: perfilForm.username.trim(),
      password_actual: perfilForm.password_actual,
    })
  }

  function handleSubmitPassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (
      !passwordForm.password_actual.trim() ||
      !passwordForm.password_nueva.trim() ||
      !passwordForm.confirmar_password.trim()
    ) {
      setPasswordError('Completa todos los campos de contraseña.')
      return
    }

    if (passwordForm.password_nueva !== passwordForm.confirmar_password) {
      setPasswordError('La nueva contraseña y su confirmación no coinciden.')
      return
    }

    if (passwordForm.password_nueva.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (passwordForm.password_actual === passwordForm.password_nueva) {
      setPasswordError('La nueva contraseña no puede ser igual a la actual.')
      return
    }

    changePasswordMutation.mutate({
      password_actual: passwordForm.password_actual,
      password_nueva: passwordForm.password_nueva,
    })
  }

  function handleEnableTotp(e: React.FormEvent) {
    e.preventDefault()
    setTotpError(null)
    setTotpSuccess(null)

    if (!totpSetup) {
      setTotpError('No se pudo generar la configuración TOTP.')
      return
    }

    if (!enableTotpForm.code.trim()) {
      setTotpError('Ingresa el código generado por tu aplicación autenticadora.')
      return
    }

    enableTotpMutation.mutate(enableTotpForm.code.trim())
  }

  function handleDisableTotp(e: React.FormEvent) {
    e.preventDefault()
    setTotpError(null)
    setTotpSuccess(null)

    if (!disableTotpForm.password.trim() || !disableTotpForm.code.trim()) {
      setTotpError('Debes ingresar tu contraseña y el código TOTP.')
      return
    }

    disableTotpMutation.mutate({
      password: disableTotpForm.password,
      code: disableTotpForm.code,
    })
  }

  const currentRole = perfil?.rol_nombre ?? (perfil?.rol_id ? `Rol #${perfil.rol_id}` : '—')
  const currentEstado =
    perfil?.estado_usuario_nombre ??
    (perfil?.estado_usuario_id ? `Estado #${perfil.estado_usuario_id}` : '—')

  const accessLabel = perfil?.is_active ? 'Activa' : 'Inactiva'
  const totpLabel = perfil?.is_totp_enabled ? 'Habilitado' : 'Deshabilitado'
  const email2faLabel = perfil?.is_email_2fa_enabled ? 'Habilitado' : 'Deshabilitado'
  const lastAccessLabel = perfil?.ultimo_acceso
    ? new Date(perfil.ultimo_acceso).toLocaleString()
    : 'Nunca'

  const isPerfilLoading = perfilQuery.isLoading
  const isDirty =
    !!perfil &&
    (perfilForm.email !== perfil.email || perfilForm.username !== perfil.username)

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
        {isPerfilLoading ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <SkeletonBox className="h-16 w-16" />
              <div className="space-y-2">
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-8 w-48" />
                <SkeletonBox className="h-4 w-64" />
              </div>
            </div>
            <SkeletonBox className="h-4 w-full max-w-2xl" />
            <div className="flex flex-wrap gap-2">
              <SkeletonBox className="h-8 w-24 rounded-full" />
              <SkeletonBox className="h-8 w-24 rounded-full" />
              <SkeletonBox className="h-8 w-28 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/70 bg-background">
                  <UserCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Perfil de usuario</p>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {perfil?.username ?? 'Mi perfil'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {perfil?.email ?? '—'}
                  </p>
                </div>
              </div>

              <p className="max-w-2xl text-sm text-muted-foreground">
                Consulta tus datos, actualiza tu cuenta y administra tu seguridad desde un solo lugar.
              </p>

              <div className="flex flex-wrap gap-2">
                <StatusPill tone="info">{currentRole}</StatusPill>
                <StatusPill>{currentEstado}</StatusPill>
                <StatusPill tone={perfil?.is_active ? 'success' : 'warning'}>
                  Cuenta {accessLabel.toLowerCase()}
                </StatusPill>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['mi-perfil'] })
                  setApiError(null)
                  setSuccessMessage(null)
                  setPasswordError(null)
                  setPasswordSuccess(null)
                  setTotpError(null)
                  setTotpSuccess(null)
                }}
                className="border-border/70"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Recargar
              </Button>
            </div>
          </div>
        )}
      </section>

      {perfilQuery.error && (
        <AlertBox message="Error al cargar la información del perfil." tone="error" />
      )}

      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5" />
              Resumen de cuenta
            </CardTitle>
            <CardDescription>Información principal de tu cuenta y acceso.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {isPerfilLoading ? (
              <>
                <SkeletonBox className="h-14 w-full" />
                <SkeletonBox className="h-14 w-full" />
                <SkeletonBox className="h-14 w-full" />
              </>
            ) : perfil ? (
              <>
                <ReadonlyInfoBlock label="CI" value={perfil.ci} />
                <ReadonlyInfoBlock label="Último acceso" value={lastAccessLabel} />
                <ReadonlyInfoBlock
                  label="Seguridad"
                  value={
                    perfil.is_totp_enabled || perfil.is_email_2fa_enabled
                      ? 'Protegida'
                      : 'Básica'
                  }
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  <StatusPill tone={perfil?.is_totp_enabled ? 'success' : 'warning'}>
                    TOTP {totpLabel.toLowerCase()}
                  </StatusPill>
                  <StatusPill tone={perfil?.is_email_2fa_enabled ? 'success' : 'warning'}>
                    Correo 2FA {email2faLabel.toLowerCase()}
                  </StatusPill>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Datos básicos</CardTitle>
              <CardDescription>
                Edita tu correo y nombre de usuario. Debes confirmar con tu contraseña actual.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isPerfilLoading ? (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <SkeletonBox className="h-20 w-full" />
                    <SkeletonBox className="h-20 w-full" />
                    <SkeletonBox className="h-20 w-full" />
                  </div>
                  <SkeletonBox className="h-10 w-full" />
                  <SkeletonBox className="h-10 w-full" />
                  <SkeletonBox className="h-10 w-full" />
                  <div className="flex justify-end">
                    <SkeletonBox className="h-10 w-40" />
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitPerfil} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <ReadonlyInfoBlock label="CI" value={perfil?.ci ?? '—'} />
                    <ReadonlyInfoBlock label="Rol" value={currentRole} />
                    <ReadonlyInfoBlock label="Estado" value={currentEstado} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo</Label>
                      <Input
                        id="email"
                        type="email"
                        value={perfilForm.email}
                        onChange={(e) =>
                          setPerfilForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="usuario@atina.bo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Usuario</Label>
                      <Input
                        id="username"
                        value={perfilForm.username}
                        onChange={(e) =>
                          setPerfilForm((prev) => ({
                            ...prev,
                            username: e.target.value,
                          }))
                        }
                        placeholder="jperez"
                      />
                    </div>
                  </div>

                  <PasswordField
                    id="perfil_password_actual"
                    label="Contraseña actual"
                    value={perfilForm.password_actual}
                    onChange={(value) =>
                      setPerfilForm((prev) => ({
                        ...prev,
                        password_actual: value,
                      }))
                    }
                    placeholder="Confirma tu contraseña para guardar cambios"
                    show={showPerfilPassword}
                    onToggle={() => setShowPerfilPassword((prev) => !prev)}
                  />

                  {apiError && <AlertBox message={apiError} tone="error" />}
                  {successMessage && <AlertBox message={successMessage} tone="success" />}

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={
                        updatePerfilMutation.isPending ||
                        perfilQuery.isLoading ||
                        !isDirty ||
                        !perfilForm.password_actual.trim()
                      }
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updatePerfilMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
              <CardDescription>
                Cambia tu contraseña y administra tu autenticación en dos pasos.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {isPerfilLoading ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <SkeletonBox className="h-80 w-full" />
                  <SkeletonBox className="h-80 w-full" />
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 font-medium text-foreground">
                          <KeyRound className="h-4 w-4" />
                          Contraseña
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Actualiza tu contraseña con confirmación manual.
                        </p>
                      </div>

                      <StatusPill tone="success">Activo</StatusPill>
                    </div>

                    <form onSubmit={handleSubmitPassword} className="space-y-4">
                      <PasswordField
                        id="password_actual"
                        label="Contraseña actual"
                        value={passwordForm.password_actual}
                        onChange={(value) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            password_actual: value,
                          }))
                        }
                        show={showCurrentPassword}
                        onToggle={() => setShowCurrentPassword((prev) => !prev)}
                      />

                      <PasswordField
                        id="password_nueva"
                        label="Nueva contraseña"
                        value={passwordForm.password_nueva}
                        onChange={(value) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            password_nueva: value,
                          }))
                        }
                        show={showNewPassword}
                        onToggle={() => setShowNewPassword((prev) => !prev)}
                        describedBy="password_requirements"
                      />

                      <PasswordField
                        id="confirmar_password"
                        label="Confirmar nueva contraseña"
                        value={passwordForm.confirmar_password}
                        onChange={(value) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            confirmar_password: value,
                          }))
                        }
                        show={showConfirmPassword}
                        onToggle={() => setShowConfirmPassword((prev) => !prev)}
                      />

                      <p id="password_requirements" className="text-xs text-muted-foreground">
                        La nueva contraseña debe tener al menos 8 caracteres y ser distinta de la actual.
                      </p>

                      {passwordError && <AlertBox message={passwordError} tone="error" />}
                      {passwordSuccess && <AlertBox message={passwordSuccess} tone="success" />}

                      <div className="flex justify-end">
                        <Button type="submit" disabled={changePasswordMutation.isPending}>
                          {changePasswordMutation.isPending ? 'Actualizando...' : 'Cambiar contraseña'}
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 font-medium text-foreground">
                          <Lock className="h-4 w-4" />
                          Autenticación TOTP
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Usa una aplicación autenticadora para generar códigos de 6 dígitos.
                        </p>
                      </div>

                      <StatusPill tone={perfil?.is_totp_enabled ? 'success' : 'warning'}>
                        {perfil?.is_totp_enabled ? 'Habilitado' : 'Deshabilitado'}
                      </StatusPill>
                    </div>

                    {totpError && !isTotpModalOpen && <AlertBox message={totpError} tone="error" />}
                    {totpSuccess && !isTotpModalOpen && <AlertBox message={totpSuccess} tone="success" />}

                    {!perfil?.is_totp_enabled ? (
                      <Button
                        type="button"
                        onClick={openTotpModal}
                        disabled={setupTotpMutation.isPending}
                        className="w-full"
                      >
                        {setupTotpMutation.isPending ? 'Generando configuración...' : 'Configurar TOTP'}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <div className="flex items-center gap-2">
                            <Unlock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <p className="font-medium text-foreground">TOTP está habilitado</p>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Para desactivarlo, confirma tu contraseña y el código actual generado por tu aplicación autenticadora.
                          </p>
                        </div>

                        <form
                          onSubmit={handleDisableTotp}
                          className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4"
                        >
                          <PasswordField
                            id="disable_totp_password"
                            label="Contraseña actual"
                            value={disableTotpForm.password}
                            onChange={(value) =>
                              setDisableTotpForm((prev) => ({
                                ...prev,
                                password: value,
                              }))
                            }
                            show={showDisableTotpPassword}
                            onToggle={() => setShowDisableTotpPassword((prev) => !prev)}
                          />

                          <div className="space-y-2">
                            <Label htmlFor="disable_totp_code">Código TOTP</Label>
                            <Input
                              id="disable_totp_code"
                              value={disableTotpForm.code}
                              onChange={(e) =>
                                setDisableTotpForm((prev) => ({
                                  ...prev,
                                  code: e.target.value.replace(/\s/g, ''),
                                }))
                              }
                              placeholder="Código actual"
                              maxLength={6}
                              className="tracking-[0.35em]"
                            />
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              variant="destructive"
                              disabled={disableTotpMutation.isPending}
                            >
                              {disableTotpMutation.isPending ? 'Desactivando...' : 'Desactivar TOTP'}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={isTotpModalOpen} onOpenChange={(open) => !open && closeTotpModal()}>
        <DialogContent className="border-border/70 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar autenticación TOTP</DialogTitle>
            <DialogDescription>
              Escanea el código QR con tu aplicación autenticadora y confirma el código generado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {totpError && <AlertBox message={totpError} tone="error" />}

            {!totpSetup ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-6">
                  <div className="space-y-2 text-center">
                    <p className="text-sm font-medium text-foreground">Generando configuración</p>
                    <p className="text-sm text-muted-foreground">
                      Estamos preparando tu código QR y los datos de configuración.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                  <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-background p-4">
                    <QRCodeSVG value={totpSetup.uri} size={180} />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Escanea el código QR</p>
                      <p className="text-sm text-muted-foreground">
                        Usa Google Authenticator, Authy, Microsoft Authenticator o cualquier aplicación compatible.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Secreto manual</Label>
                      <div className="flex gap-2">
                        <Input value={totpSetup.secret} readOnly className="font-mono text-sm" />
                        <Button
                          type="button"
                          variant="outline"
                          className="border-border/70"
                          onClick={() => copyToClipboard(totpSetup.secret, 'secret')}
                        >
                          {copiedSecret ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>URI de provisión</Label>
                      <div className="flex gap-2">
                        <Input value={totpSetup.uri} readOnly className="font-mono text-xs" />
                        <Button
                          type="button"
                          variant="outline"
                          className="border-border/70"
                          onClick={() => copyToClipboard(totpSetup.uri, 'uri')}
                        >
                          {copiedUri ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <form onSubmit={handleEnableTotp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totp_code">Código de verificación</Label>
                    <Input
                      id="totp_code"
                      value={enableTotpForm.code}
                      onChange={(e) =>
                        setEnableTotpForm({
                          code: e.target.value.replace(/\s/g, ''),
                        })
                      }
                      placeholder="Código de 6 dígitos"
                      maxLength={6}
                      className="tracking-[0.35em]"
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" className="border-border/70" onClick={closeTotpModal}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={enableTotpMutation.isPending}>
                      {enableTotpMutation.isPending ? 'Activando...' : 'Activar TOTP'}
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}