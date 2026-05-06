import { Link } from 'react-router-dom'
import { Droplets } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LoginModal } from '@/components/LoginModal'
import { ThemeToggle } from '@/components/ThemeToggle'

type AppNavbarProps = {
  showAuthActions?: boolean
}

export function AppNavbar({ showAuthActions = true }: AppNavbarProps) {
  return (
    <header className="px-6 lg:px-14 h-16 flex items-center border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
        <Droplets className="h-6 w-6" />
        <span>ATINA</span>
      </Link>

      <div className="ml-auto flex items-center gap-3">
        {showAuthActions && (
          <>
            <LoginModal>
              <Button variant="ghost">Iniciar Sesión</Button>
            </LoginModal>

            <Link to="/register">
              <Button>Registrarse</Button>
            </Link>
          </>
        )}

        <ThemeToggle />
      </div>
    </header>
  )
}