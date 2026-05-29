import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/context/AuthContext'

type RoleRouteProps = {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { isAuthenticated, role } = useAuth()

  // Console logs para depuración
  console.log('=== RoleRoute Debug ===')
  console.log('isAuthenticated:', isAuthenticated)
  console.log('role del usuario:', role)
  console.log('rol type:', typeof role)
  console.log('allowedRoles:', allowedRoles)
  console.log('allowedRoles strings:', allowedRoles.map(r => `"${r}"`))
  console.log('¿role está en allowedRoles?', role ? allowedRoles.includes(role) : 'role es null/undefined')
  console.log('========================')

  if (!isAuthenticated) {
    console.log('❌ No autenticado, redirigiendo a /login')
    return <Navigate to="/login" replace />
  }

  if (!role || !allowedRoles.includes(role)) {
    console.log(`❌ Rol "${role}" no permitido. Redirigiendo a /dashboard`)
    return <Navigate to="/dashboard" replace />
  }
  
  console.log(`✅ Rol "${role}" permitido. Renderizando contenido.`)
  return <>{children}</>
}