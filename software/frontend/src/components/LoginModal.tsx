import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Leaf } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { apiClient } from '@/lib/axios'

const loginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginModalProps {
  children: React.ReactNode;
}

export function LoginModal({ children }: LoginModalProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setApiError(null)
    
    try {
      const formData = new URLSearchParams()
      formData.append('username', data.username)
      formData.append('password', data.password)

      const response = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      
      const token = response.data.access_token
      if (token) {
        localStorage.setItem('token', token)
        setIsOpen(false) // Cerramos el modal al tener éxito
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

  // Esta función limpia los errores y el formulario si el usuario cierra la ventana sin loguearse
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      form.reset()
      setApiError(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {/* El botón que el usuario presione se inyectará aquí */}
        {children}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto bg-green-100 dark:bg-green-900/20 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <Leaf className="text-green-600 dark:text-green-500 w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl text-center">Bienvenido de nuevo</DialogTitle>
          <DialogDescription className="text-center">
            Ingresa tus credenciales para acceder a ATINA.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField 
              control={form.control} 
              name="username" 
              render={(props) => (
              <FormItem>
                <FormLabel>Nombre de Usuario</FormLabel>
                <FormControl><Input placeholder="jperez" {...props.field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField 
              control={form.control} 
              name="password" 
              render={(props) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl><Input type="password" placeholder="********" {...props.field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {apiError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {apiError}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}