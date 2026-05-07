import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { RefreshCw, Save, Shield, UserCircle2 } from 'lucide-react'

import { perfilService } from '@/services/perfil.service'
import type { PerfilPasswordPayload, PerfilUpdatePayload } from '@/types/perfil'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type PerfilFormState = {
  email: string
  username: string
}

type PasswordFormState = {
  password_actual: string
  password_nueva: string
  confirmar_password: string
}

const initialPasswordForm: PasswordFormState = {
  password_actual: '',
  password_nueva: '',
  confirmar_password: '',
}

export default function PerfilPage() {
  const queryClient = useQueryClient()

  const [perfilForm, setPerfilForm] = useState<PerfilFormState | null>(null)
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(initialPasswordForm)
  const [apiError, setApiError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const perfilQuery = useQuery({
    queryKey: ['mi-perfil'],
    queryFn: perfilService.getMe,
  })

  const perfil = perfilQuery.data

  const emailValue = perfilForm?.email ?? perfil?.email ?? ''
  const usernameValue = perfilForm?.username ?? perfil?.username ?? ''

  const updatePerfilMutation = useMutation({
    mutationFn: (payload: PerfilUpdatePayload) => perfilService.updateMe(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mi-perfil'] })
      setApiError(null)
      setSuccessMessage('Perfil actualizado correctamente.')
      setPerfilForm(null)
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

  function handleSubmitPerfil(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)
    setSuccessMessage(null)

    if (!emailValue.trim() || !usernameValue.trim()) {
      setApiError('Correo y usuario son obligatorios.')
      return
    }

    updatePerfilMutation.mutate({
      email: emailValue.trim(),
      username: usernameValue.trim(),
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

    changePasswordMutation.mutate({
      password_actual: passwordForm.password_actual,
      password_nueva: passwordForm.password_nueva,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mi perfil</h1>
          <p className="text-muted-foreground">
            Consulta y actualiza la información de tu cuenta.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['mi-perfil'] })
            setPerfilForm(null)
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Recargar
        </Button>
      </div>

      {perfilQuery.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          Error al cargar la información del perfil.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5" />
              Cuenta
            </CardTitle>
            <CardDescription>Resumen de tu información actual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {perfilQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando perfil...</p>
            ) : perfil ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Usuario</p>
                  <p className="font-medium">{perfil.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Correo</p>
                  <p className="font-medium">{perfil.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-medium">{perfil.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rol</p>
                  <p className="font-medium">{perfil.rol_id ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="font-medium">{perfil.estado_usuario_id ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Último acceso</p>
                  <p className="font-medium">
                    {perfil.ultimo_acceso
                      ? new Date(perfil.ultimo_acceso).toLocaleString()
                      : 'Nunca'}
                  </p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Datos básicos</CardTitle>
              <CardDescription>
                Actualiza tu nombre de usuario y correo electrónico.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPerfil} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo</Label>
                    <Input
                      id="email"
                      type="email"
                      value={emailValue}
                      onChange={(e) =>
                        setPerfilForm((prev) => ({
                          email: e.target.value,
                          username: prev?.username ?? perfil?.username ?? '',
                        }))
                      }
                      placeholder="usuario@atina.bo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Usuario</Label>
                    <Input
                      id="username"
                      value={usernameValue}
                      onChange={(e) =>
                        setPerfilForm((prev) => ({
                          email: prev?.email ?? perfil?.email ?? '',
                          username: e.target.value,
                        }))
                      }
                      placeholder="jperez"
                    />
                  </div>
                </div>

                {apiError && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {apiError}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    {successMessage}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={updatePerfilMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {updatePerfilMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
              <CardDescription>
                Cambia tu contraseña de acceso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPassword} className="space-y-5">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password_actual">Contraseña actual</Label>
                    <Input
                      id="password_actual"
                      type="password"
                      value={passwordForm.password_actual}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          password_actual: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password_nueva">Nueva contraseña</Label>
                    <Input
                      id="password_nueva"
                      type="password"
                      value={passwordForm.password_nueva}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          password_nueva: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmar_password">Confirmar nueva contraseña</Label>
                    <Input
                      id="confirmar_password"
                      type="password"
                      value={passwordForm.confirmar_password}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmar_password: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                {passwordError && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    {passwordSuccess}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? 'Actualizando...' : 'Cambiar contraseña'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}