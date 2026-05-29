import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Leaf,
  User,
  Shield,
  ArrowLeft,
  CreditCard,
  Eye,
  EyeOff,
  Mail,
  Phone,
  FileImage,
  CheckCircle2,
  Info,
} from 'lucide-react'
import axios from 'axios'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { apiClient } from '@/lib/axios'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const BIO_MAX_LENGTH = 500

const registerSchema = z
  .object({
    ci: z
      .string()
      .min(5, 'El CI debe tener al menos 5 dígitos')
      .max(20, 'El CI no puede superar los 20 dígitos')
      .regex(/^\d+$/, 'El CI solo debe contener números'),
    nombres: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    apellido_paterno: z.string().min(2, 'El apellido paterno debe tener al menos 2 caracteres'),
    apellido_materno: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
    telefono: z.string().max(30, 'Máximo 30 caracteres').optional().or(z.literal('')),
    bio: z.string().max(BIO_MAX_LENGTH, `Máximo ${BIO_MAX_LENGTH} caracteres`).optional().or(z.literal('')),
    username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(50),
    email: z.string().email('Ingresa un correo electrónico válido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

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

  return <div className={`rounded-xl border p-3 text-sm ${classes}`}>{message}</div>
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span>{title}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function PasswordField({
  id,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggle: () => void
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••'}
        className="pr-12"
        autoComplete={autoComplete}
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
  )
}

export default function RegisterScreen() {
  const navigate = useNavigate()
  const firstErrorFocusRef = useRef(false)

  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      ci: '',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      telefono: '',
      bio: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const bioValue = form.watch('bio') ?? ''
  const passwordValue = form.watch('password') ?? ''

  const passwordChecks = useMemo(
    () => [
      { label: 'Mínimo 8 caracteres', valid: passwordValue.length >= 8 },
      { label: 'Debe ser distinta de tu nombre de usuario', valid: true },
    ],
    [passwordValue]
  )

  const handlePhotoChange = (file: File | null) => {
    setPhotoError(null)

    if (!file) {
      setPhotoFile(null)
      return
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setPhotoError('Solo se permiten imágenes JPG, PNG o WEBP.')
      setPhotoFile(null)
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setPhotoError('La imagen no debe superar los 5 MB.')
      setPhotoFile(null)
      return
    }

    setPhotoFile(file)
  }

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setApiError(null)

    try {
      const formData = new FormData()
      formData.append('ci', data.ci.trim())
      formData.append('username', data.username.trim())
      formData.append('email', data.email.trim())
      formData.append('password', data.password)
      formData.append('nombres', data.nombres.trim())
      formData.append('apellido_paterno', data.apellido_paterno.trim())

      if (data.apellido_materno?.trim()) {
        formData.append('apellido_materno', data.apellido_materno.trim())
      }

      if (data.telefono?.trim()) {
        formData.append('telefono', data.telefono.trim())
      }

      if (data.bio?.trim()) {
        formData.append('bio', data.bio.trim())
      }

      if (photoFile) {
        formData.append('foto', photoFile)
      }

      await apiClient.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      navigate('/login', {
        state: { message: 'Cuenta creada exitosamente. Ahora puedes iniciar sesión.' },
      })
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail

        if (typeof detail === 'string') {
          setApiError(detail)
        } else if (Array.isArray(detail)) {
          setApiError(
            detail
              .map((item: { msg?: string; loc?: (string | number)[] }) => {
                const field = item.loc?.join(' -> ') ?? 'campo'
                return `${field}: ${item.msg ?? 'error de validación'}`
              })
              .join(' | ')
          )
        } else {
          setApiError('No se pudo completar el registro.')
        }
      } else {
        setApiError('Ocurrió un error inesperado al conectar con el servidor.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const errors = form.formState.errors
    const firstErrorKey = Object.keys(errors)[0] as keyof RegisterFormValues | undefined

    if (!firstErrorKey) {
      firstErrorFocusRef.current = false
      return
    }

    if (firstErrorFocusRef.current) return

    firstErrorFocusRef.current = true
    form.setFocus(firstErrorKey)
  }, [form.formState.errors, form])

  return (
    <div className="flex min-h-[calc(100vh-2rem)] w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>

        <Card className="w-full border-slate-200 shadow-xl dark:border-slate-800">
          <CardHeader className="space-y-4 pb-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <Leaf className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Crear cuenta en ATINA
              </CardTitle>
              <CardDescription className="mx-auto max-w-md text-sm leading-relaxed">
                Completa tus datos personales y credenciales de acceso. Los campos marcados como opcionales pueden dejarse vacíos.
              </CardDescription>
            </div>

            <div className="mx-auto flex max-w-lg items-start gap-3 rounded-xl bg-muted/40 p-4 text-left">
              <Info className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-muted-foreground">
                Usa tu CI sin lugar de expedición y una contraseña de al menos 8 caracteres. La foto de perfil es opcional.
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
                {apiError && <AlertBox message={apiError} tone="error" />}

                <div className="space-y-5">
                  <SectionHeader
                    icon={User}
                    title="Datos de perfil"
                    description="Información básica para identificar tu cuenta."
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="ci"
                      render={(props) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>CI</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                placeholder="12345678"
                                inputMode="numeric"
                                autoComplete="off"
                                className="pl-10"
                                {...props.field}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '')
                                  props.field.onChange(value)
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Ingresa solo números, sin lugar de expedición. Ejemplo correcto: 12345678.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nombres"
                      render={(props) => (
                        <FormItem>
                          <FormLabel>Nombres</FormLabel>
                          <FormControl>
                            <Input placeholder="Juan Carlos" autoComplete="given-name" {...props.field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="apellido_paterno"
                      render={(props) => (
                        <FormItem>
                          <FormLabel>Apellido paterno</FormLabel>
                          <FormControl>
                            <Input placeholder="Pérez" autoComplete="family-name" {...props.field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="apellido_materno"
                      render={(props) => (
                        <FormItem>
                          <FormLabel>Apellido materno</FormLabel>
                          <FormControl>
                            <Input placeholder="Gómez" {...props.field} />
                          </FormControl>
                          <FormDescription>Opcional.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefono"
                      render={(props) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                placeholder="71234567"
                                inputMode="tel"
                                className="pl-10"
                                {...props.field}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^\d+()\-\s]/g, '')
                                  props.field.onChange(value)
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Opcional. Usa un número activo de contacto.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel>Foto de perfil</FormLabel>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-4 transition-colors hover:bg-accent">
                      <div className="rounded-lg bg-muted p-2">
                        <FileImage className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {photoFile ? photoFile.name : 'Selecciona una imagen desde tu equipo'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG o WEBP, hasta 5 MB.
                        </p>
                      </div>

                      <div className="shrink-0">
                        <span className="inline-flex rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                          Elegir archivo
                        </span>
                      </div>

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null
                          handlePhotoChange(file)
                        }}
                      />
                    </label>

                    {!photoError && (
                      <p className="text-xs text-muted-foreground">
                        Opcional. Puedes agregarla ahora o configurarla más adelante.
                      </p>
                    )}

                    {photoError && <p className="text-sm text-red-500">{photoError}</p>}
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={(props) => (
                      <FormItem>
                        <div className="flex items-center justify-between gap-3">
                          <FormLabel>Biografía</FormLabel>
                          <span className="text-xs text-muted-foreground">
                            {bioValue.length}/{BIO_MAX_LENGTH}
                          </span>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="Cuéntanos brevemente sobre ti, tu rol o tu relación con el proyecto..."
                            className="min-h-[110px] resize-none"
                            maxLength={BIO_MAX_LENGTH}
                            {...props.field}
                          />
                        </FormControl>
                        <FormDescription>
                          Opcional. Una breve descripción ayuda a completar tu perfil.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-5">
                  <SectionHeader
                    icon={Shield}
                    title="Datos de acceso"
                    description="Credenciales que usarás para iniciar sesión en la plataforma."
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="username"
                      render={(props) => (
                        <FormItem>
                          <FormLabel>Nombre de usuario</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="jperez"
                              autoComplete="username"
                              {...props.field}
                              onChange={(e) => props.field.onChange(e.target.value.trimStart())}
                            />
                          </FormControl>
                          <FormDescription>
                            Debe tener al menos 3 caracteres.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={(props) => (
                        <FormItem>
                          <FormLabel>Correo electrónico</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="juan@ejemplo.com"
                                autoComplete="email"
                                className="pl-10"
                                {...props.field}
                                onChange={(e) => props.field.onChange(e.target.value.trim())}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Usaremos este correo para contacto y recuperación de acceso.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={(props) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <PasswordField
                              id="password"
                              value={props.field.value}
                              onChange={props.field.onChange}
                              show={showPassword}
                              onToggle={() => setShowPassword((prev) => !prev)}
                              placeholder="Mínimo 8 caracteres"
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormDescription>
                            Usa una contraseña segura que puedas recordar.
                          </FormDescription>

                          <div className="space-y-1 rounded-xl bg-muted/40 p-3">
                            {passwordChecks.map((check) => (
                              <div
                                key={check.label}
                                className="flex items-center gap-2 text-xs text-muted-foreground"
                              >
                                <CheckCircle2
                                  className={`h-3.5 w-3.5 ${
                                    check.valid
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                                <span>{check.label}</span>
                              </div>
                            ))}
                          </div>

                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={(props) => (
                        <FormItem>
                          <FormLabel>Confirmar contraseña</FormLabel>
                          <FormControl>
                            <PasswordField
                              id="confirmPassword"
                              value={props.field.value}
                              onChange={props.field.onChange}
                              show={showConfirmPassword}
                              onToggle={() => setShowConfirmPassword((prev) => !prev)}
                              placeholder="Repite tu contraseña"
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormDescription>
                            Debe coincidir exactamente con la contraseña anterior.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    className="h-11 w-full"
                    disabled={isLoading || !!photoError}
                  >
                    {isLoading ? 'Registrando...' : 'Crear cuenta'}
                  </Button>

                  <p className="text-center text-xs leading-relaxed text-muted-foreground">
                    Al crear tu cuenta, confirmas que la información proporcionada es válida y actual.
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="mt-2 flex justify-center border-t p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}