import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Leaf, User, Shield, Upload, ArrowLeft } from 'lucide-react'
import axios from 'axios'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { apiClient } from '@/lib/axios'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const registerSchema = z.object({
  nombres: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellidos: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  telefono: z.string().max(30, 'Máximo 30 caracteres').optional().or(z.literal('')),
  bio: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(50),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterScreen() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      telefono: '',
      bio: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

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
      formData.append('username', data.username)
      formData.append('email', data.email)
      formData.append('password', data.password)
      formData.append('nombres', data.nombres)
      formData.append('apellidos', data.apellidos)

      if (data.telefono?.trim()) {
        formData.append('telefono', data.telefono.trim())
      }

      if (data.bio?.trim()) {
        formData.append('bio', data.bio.trim())
      }

      if (photoFile) {
        formData.append('foto', photoFile)
      }

      await apiClient.post('/auth/register', formData)

      navigate('/login', {
        state: { message: 'Cuenta creada exitosamente. Ahora puedes iniciar sesión.' },
      })
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('ERROR REGISTER:', error.response?.data)
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

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>

        <Card className="w-full shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="mx-auto bg-green-100 dark:bg-green-900/20 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Leaf className="text-green-600 dark:text-green-500 w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Crear cuenta en ATINA</CardTitle>
            <CardDescription>Completa los datos de perfil y acceso</CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <User className="h-4 w-4" />
                    Datos de perfil
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nombres"
                      render={(props) => (
                        <FormItem>
                          <FormLabel>Nombres</FormLabel>
                          <FormControl>
                            <Input placeholder="Juan" {...props.field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="apellidos"
                      render={(props) => (
                        <FormItem>
                          <FormLabel>Apellidos</FormLabel>
                          <FormControl>
                            <Input placeholder="Pérez" {...props.field} />
                          </FormControl>
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
                            <Input placeholder="71234567" {...props.field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel>Foto de perfil</FormLabel>
                    <label className="flex items-center gap-3 rounded-md border border-dashed border-border p-4 cursor-pointer hover:bg-accent transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {photoFile ? photoFile.name : 'Selecciona una imagen desde tu equipo'}
                      </span>
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
                    {photoError && (
                      <p className="text-sm text-red-500">{photoError}</p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={(props) => (
                      <FormItem>
                        <FormLabel>Biografía</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cuéntanos brevemente sobre ti..."
                            className="min-h-[100px]"
                            {...props.field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    Datos de acceso
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={(props) => (
                        <FormItem>
                          <FormLabel>Nombre de usuario</FormLabel>
                          <FormControl>
                            <Input placeholder="jperez" {...props.field} />
                          </FormControl>
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
                            <Input type="email" placeholder="juan@ejemplo.com" {...props.field} />
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

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={(props) => (
                        <FormItem>
                          <FormLabel>Confirmar contraseña</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...props.field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {apiError && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md">
                    {apiError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading || !!photoError}>
                  {isLoading ? 'Registrando...' : 'Crear cuenta'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex justify-center border-t p-4 mt-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold text-green-600 hover:text-green-700">
                Inicia sesión aquí
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}