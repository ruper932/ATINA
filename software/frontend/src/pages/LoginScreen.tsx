import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Leaf,
  ArrowLeft,
  Mail,
  Shield,
  Eye,
  EyeOff,
  LogIn,
  LockKeyhole,
} from 'lucide-react'
import axios from 'axios'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { apiClient } from '@/lib/axios'
import { useAuth } from '@/hooks/useAuth'
import { OtpInput } from '@/components/auth/OtpInput'

const loginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginFormValues = z.infer<typeof loginSchema>
type TwoFactorMethod = 'email' | 'totp'

type LoginResponse = {
  access_token?: string | null
  token_type?: string | null
  requires_2fa?: boolean
  temp_token?: string | null
  message?: string | null
  method?: TwoFactorMethod
}

const OTP_LENGTH = 6

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

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
}: {
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggle: () => void
}) {
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        placeholder="••••••••"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-12"
        autoComplete="current-password"
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

export default function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuth()

  const successMessage = location.state?.message
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [tempToken, setTempToken] = useState<string | null>(null)
  const [otpMethod, setOtpMethod] = useState<TwoFactorMethod | null>(null)
  const [otpMessage, setOtpMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [trustDevice, setTrustDevice] = useState(false)

  const lastSubmittedOtpRef = useRef<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setApiError(null)

    try {
      const formData = new URLSearchParams()
      formData.append('username', data.username)
      formData.append('password', data.password)

      const response = await apiClient.post<LoginResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const payload = response.data

      if (payload.access_token) {
        setAuth(payload.access_token)
        navigate('/dashboard')
        return
      }

      if (payload.requires_2fa && payload.temp_token && payload.method) {
        setTempToken(payload.temp_token)
        setOtpMethod(payload.method)
        setOtpMessage(payload.message ?? 'Ingresa tu código de verificación.')
        setTrustDevice(false)
        setOtpCode('')
        setApiError(null)
        lastSubmittedOtpRef.current = null
        return
      }

      setApiError('La respuesta del servidor no es válida.')
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        setApiError(error.response.data.detail)
      } else {
        setApiError('Usuario o contraseña incorrectos.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async (codeParam?: string) => {
    const normalizedCode = (codeParam ?? otpCode).replace(/\D/g, '')

    if (!tempToken || !otpMethod) {
      setApiError('No hay una verificación 2FA pendiente.')
      return
    }

    if (normalizedCode.length !== OTP_LENGTH) {
      return
    }

    if (isVerifyingOtp) return

    setIsVerifyingOtp(true)
    setApiError(null)

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login/verify-2fa', {
        temp_token: tempToken,
        code: normalizedCode,
        method: otpMethod,
        trust_device: trustDevice,
      })

      const token = response.data?.access_token

      if (token) {
        setAuth(token)
        navigate('/dashboard')
        return
      }

      setApiError('No se recibió el token de acceso.')
      setOtpCode('')
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail
        setApiError(typeof detail === 'string' ? detail : 'Código OTP incorrecto o expirado.')
      } else {
        setApiError('Ocurrió un error inesperado al verificar el código.')
      }

      setOtpCode('')
      lastSubmittedOtpRef.current = null
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  useEffect(() => {
    if (!tempToken || !otpMethod) return
    if (otpCode.length !== OTP_LENGTH) return
    if (isVerifyingOtp) return
    if (lastSubmittedOtpRef.current === otpCode) return

    lastSubmittedOtpRef.current = otpCode
    void verifyOtp(otpCode)
  }, [otpCode, tempToken, otpMethod, isVerifyingOtp, trustDevice])

  const resetToLogin = () => {
    setTempToken(null)
    setOtpMethod(null)
    setOtpMessage(null)
    setOtpCode('')
    setTrustDevice(false)
    setApiError(null)
    lastSubmittedOtpRef.current = null
  }

  const in2FAStep = Boolean(tempToken && otpMethod)

  const otpMethodLabel =
    otpMethod === 'email'
      ? 'Código por correo'
      : otpMethod === 'totp'
        ? 'Aplicación autenticadora'
        : ''

  const otpMethodDescription =
    otpMethod === 'email'
      ? 'Revisa tu correo electrónico e ingresa el código recibido.'
      : 'Ingresa el código generado por tu aplicación autenticadora.'

  return (
    <div className="flex min-h-[calc(100vh-2rem)] w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>

        <Card className="border-slate-200 shadow-xl dark:border-slate-800">
          <CardHeader className="space-y-4 pb-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              {in2FAStep ? <Shield className="h-7 w-7" /> : <Leaf className="h-7 w-7" />}
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {in2FAStep ? 'Verificación en dos pasos' : 'Bienvenido a ATINA'}
              </CardTitle>
              <CardDescription className="mx-auto max-w-sm text-sm">
                {in2FAStep
                  ? otpMethodDescription
                  : 'Inicia sesión para acceder al panel de monitoreo, riego y gestión de infraestructura.'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {successMessage && !in2FAStep && (
              <AlertBox message={successMessage} tone="success" />
            )}

            {apiError && <AlertBox message={apiError} tone="error" />}

            {!in2FAStep ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="username"
                    render={(props) => (
                      <FormItem>
                        <FormLabel>Nombre de usuario o correo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="jperez o juan@ejemplo.com"
                            autoComplete="username"
                            {...props.field}
                          />
                        </FormControl>
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
                            value={props.field.value}
                            onChange={props.field.onChange}
                            show={showPassword}
                            onToggle={() => setShowPassword((prev) => !prev)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="h-11 w-full gap-2" disabled={isLoading}>
                    <LogIn className="h-4 w-4" />
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
                  <div className="mt-0.5 rounded-lg bg-background p-2">
                    {otpMethod === 'email' ? (
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{otpMethodLabel}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {otpMessage ?? otpMethodDescription}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm font-medium">Ingresa tu código</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      La validación se realiza automáticamente al completar los 6 dígitos.
                    </p>
                  </div>

                  <OtpInput
                    value={otpCode}
                    onChange={(value) => {
                      setApiError(null)
                      setOtpCode(value.replace(/\D/g, '').slice(0, OTP_LENGTH))
                    }}
                    onComplete={(value) => {
                      if (!isVerifyingOtp && tempToken && otpMethod) {
                        verifyOtp(value)
                      }
                    }}
                    disabled={isVerifyingOtp}
                  />

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    <span>Código de 6 dígitos</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-xl border p-4">
                  <Checkbox
                    id="trust-device-login"
                    checked={trustDevice}
                    onCheckedChange={(checked) => setTrustDevice(Boolean(checked))}
                    disabled={isVerifyingOtp}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="trust-device-login"
                      className="text-sm font-medium leading-none"
                    >
                      Confiar en este dispositivo
                    </label>
                    <p className="text-xs text-muted-foreground">
                      No se solicitará el segundo factor nuevamente durante 30 días en este navegador.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={resetToLogin}
                  disabled={isVerifyingOtp}
                >
                  Volver
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t p-4">
            {!in2FAStep ? (
              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                ¿No tienes cuenta?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  Regístrate aquí
                </Link>
              </p>
            ) : (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Si no puedes acceder a tu segundo factor, contacta a un administrador.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}