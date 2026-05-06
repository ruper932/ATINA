import {
  LayoutDashboard,
  Users,
  Cpu,
  CloudRain,
  BarChart3,
  Settings,
  ShieldCheck,
  Leaf,
  MapPin,
  Droplets,
  Activity, // <- Nuevo para sensores
} from 'lucide-react'
import type { UserRole } from '@/context/AuthContext'

export type NavItem = {
  title: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  allowedRoles: UserRole[]
}

export const dashboardNavItems: NavItem[] = [
  {
    title: 'Resumen',
    to: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'docente', 'tecnico', 'estudiante', 'invitado'],
  },
  {
    title: 'Usuarios',
    to: '/dashboard/usuarios',
    icon: Users,
    allowedRoles: ['admin'],
  },
  {
    title: 'Roles',
    to: '/dashboard/roles',
    icon: ShieldCheck,
    allowedRoles: ['admin'],
  },
  {
    title: 'Dispositivos',
    to: '/dashboard/dispositivos',
    icon: Cpu,
    allowedRoles: ['admin', 'tecnico'],
  },
  // --- NUEVO ---
  {
    title: 'Sensores',
    to: '/dashboard/sensores',
    icon: Activity,
    allowedRoles: ['admin', 'tecnico'],
  },
  // -------------
  {
    title: 'Captación',
    to: '/dashboard/captacion',
    icon: CloudRain,
    allowedRoles: ['admin', 'tecnico', 'docente'],
  },
  {
    title: 'Ubicaciones',
    to: '/dashboard/ubicaciones',
    icon: MapPin,
    allowedRoles: ['admin', 'tecnico', 'docente'],
  },
  {
    title: 'Invernaderos',
    to: '/dashboard/invernaderos',
    icon: Leaf,
    allowedRoles: ['admin', 'tecnico', 'docente'],
  },
  {
    title: 'Atrapanieblas',
    to: '/dashboard/atrapanieblas',
    icon: CloudRain, 
    allowedRoles: ['admin', 'tecnico', 'docente'],
  },
  {
    title: 'Fuentes de Agua',
    to: '/dashboard/fuentes-agua',
    icon: Droplets,
    allowedRoles: ['admin', 'tecnico', 'docente'],
  },
  {
    title: 'Reportes',
    to: '/dashboard/reportes',
    icon: BarChart3,
    allowedRoles: ['admin', 'docente', 'tecnico', 'estudiante'],
  },
  {
    title: 'Configuración',
    to: '/dashboard/configuracion',
    icon: Settings,
    allowedRoles: ['admin'],
  }
]