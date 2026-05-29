import { Link, useLocation } from 'react-router-dom'
import { User, LogOut, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LoginModal } from '@/components/LoginModal'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'

type AppNavbarProps = {
  showAuthActions?: boolean
}

function formatRoleLabel(role: string | null) {
  if (!role) return 'Usuario'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function getPageTitle(pathname: string) {
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname === '/dashboard/perfil') return 'Perfil'
  if (pathname.startsWith('/dashboard/reportes')) return 'Reportes'
  if (pathname.startsWith('/dashboard/usuarios')) return 'Usuarios'
  if (pathname.startsWith('/dashboard/configuracion')) return 'Configuración'

  if (pathname.startsWith('/dashboard/')) {
    const lastSegment = pathname.split('/').filter(Boolean).pop() ?? 'dashboard'
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }

  if (pathname === '/') return 'Inicio'
  if (pathname === '/register') return 'Registro'
  return 'Página actual'
}

export function AppNavbar({
  showAuthActions = true,
}: AppNavbarProps) {
  const { isAuthenticated, role, logout } = useAuth()
  const location = useLocation()

  const pageTitle = getPageTitle(location.pathname)

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6 lg:px-8">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {pageTitle}
          </h1>

          {isAuthenticated && (
            <p className="truncate text-xs capitalize text-muted-foreground">
              Rol actual: {formatRoleLabel(role)}
            </p>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {showAuthActions && !isAuthenticated && (
            <>
              <LoginModal>
                <Button variant="ghost" className="rounded-xl">
                  Iniciar sesión
                </Button>
              </LoginModal>

              <Link to="/register">
                <Button className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                  Registrarse
                </Button>
              </Link>
            </>
          )}

          <ThemeToggle />

          {isAuthenticated && (
            <div className="group relative ml-1">
              <div className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-card px-2.5 py-1.5 transition-colors hover:bg-accent/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <User className="h-4 w-4" />
                </div>

                <div className="hidden min-w-0 text-left md:block">
                  <p className="truncate text-sm font-medium text-foreground">
                    Cuenta activa
                  </p>
                  <p className="truncate text-xs capitalize text-muted-foreground">
                    {formatRoleLabel(role)}
                  </p>
                </div>

                <ChevronDown className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:rotate-180 md:block" />
              </div>

              <div className="invisible absolute right-0 top-full z-50 mt-2 w-56 translate-y-1 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="rounded-2xl border border-border/70 bg-popover p-2 shadow-lg">
                  <Link
                    to="/dashboard/perfil"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Perfil</span>
                  </Link>

                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}