import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Leaf, ArrowLeft } from 'lucide-react'
import axios from 'axios'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { apiClient } from '@/lib/axios'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuth()

  const successMessage = location.state?.message
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

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

      const response = await apiClient.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const token = response.data.access_token

      if (token) {
        setAuth(token)
        navigate('/dashboard')
      } else {
        setApiError('No se recibió el token de acceso.')
      }
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

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>

        <Card className="w-full shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto bg-green-100 dark:bg-green-900/20 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Leaf className="text-green-600 dark:text-green-500 w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Bienvenido a ATINA</CardTitle>
            <CardDescription>Inicia sesión en tu cuenta</CardDescription>
          </CardHeader>

          <CardContent>
            {successMessage && (
              <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md">
                {successMessage}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={(props) => (
                    <FormItem>
                      <FormLabel>Nombre de Usuario o Correo</FormLabel>
                      <FormControl>
                        <Input placeholder="jperez o juan@ejemplo.com" {...props.field} />
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
                        <Input type="password" placeholder="********" {...props.field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {apiError && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md">
                    {apiError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex justify-center border-t p-4 mt-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="font-semibold text-green-600 hover:text-green-700">
                Regístrate aquí
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}