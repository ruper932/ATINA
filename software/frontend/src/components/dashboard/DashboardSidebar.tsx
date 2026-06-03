import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { dashboardNavItems } from '@/config/navigation'
import { useAuth } from '@/hooks/useAuth'

type DashboardSidebarProps = {
  open: boolean
  onOpen: () => void
  onClose: () => void
}

export function DashboardSidebar({
  open,
  onOpen,
  onClose,
}: DashboardSidebarProps) {
  const { role } = useAuth()
  const sidebarRef = useRef<HTMLDivElement>(null)

  const visibleItems = dashboardNavItems.filter((item) =>
    role ? item.allowedRoles.includes(role) : false
  )

  const handleToggle = () => {
    if (open) {
      onClose()
    } else {
      onOpen()
    }
  }

  // Cerrar sidebar al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Verificar si el clic fue en el botón de hamburguesa
        const hamburgerButton = document.querySelector('.hamburger-button')
        if (hamburgerButton && hamburgerButton.contains(event.target as Node)) {
          return // No cerrar si el clic fue en el botón de hamburguesa
        }
        onClose()
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (open && event.key === 'Escape') {
        onClose()
      }
    }

    // Prevenir scroll del body cuando el sidebar está abierto en móvil
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  return (
    <>
      {/* Botón de hamburguesa - posición original top-4 */}
      <button
        onClick={handleToggle}
        className={[
          'hamburger-button fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200',
          open 
            ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 hover:border-emerald-600' 
            : 'border-border/70 bg-card/60 text-foreground/60 backdrop-blur-sm shadow-sm hover:bg-card hover:text-foreground hover:border-border/70 hover:shadow-lg'
        ].join(' ')}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Overlay cuando el sidebar está abierto (solo en móvil) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div ref={sidebarRef} className="fixed left-0 top-0 z-40 h-screen">
        <aside
          className={[
            'h-screen overflow-hidden border-r border-border/70 bg-card shadow-2xl transition-all duration-300 ease-out',
            open ? 'w-72' : 'w-20',
          ].join(' ')}
        >
          {/* Cabecera del sidebar - sin "Panel de control" */}
          <div
            className={[
              'flex h-16 items-center border-b border-border/70 px-4 transition-all duration-300',
              open ? 'justify-between' : 'justify-center',
            ].join(' ')}
          >
            {open ? (
              <>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">
                    ATINA
                  </h2>
                </div>
                {/* Botón de cerrar dentro del sidebar (visible solo en móvil) */}
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground lg:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="h-3 w-3 rounded-full bg-emerald-600" />
            )}
          </div>

          {/* Navegación */}
          <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <nav className="space-y-1.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/dashboard'}
                      aria-label={item.title}
                      title={!open ? item.title : undefined}
                      onClick={() => {
                        // Cerrar sidebar después de navegar (en móvil)
                        if (window.innerWidth < 1024) {
                          onClose()
                        }
                      }}
                      className={({ isActive }) =>
                        [
                          'group flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                          open ? 'justify-start gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5',
                          isActive
                            ? 'text-emerald-500'
                            : 'text-muted-foreground hover:text-foreground',
                        ].join(' ')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div
                            className={[
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
                              isActive
                                ? 'text-emerald-500'
                                : 'text-muted-foreground group-hover:text-foreground',
                            ].join(' ')}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <span
                            className={[
                              'overflow-hidden whitespace-nowrap transition-all duration-200',
                              open ? 'w-auto opacity-100' : 'w-0 opacity-0',
                              isActive ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : '',
                            ].join(' ')}
                          >
                            {item.title}
                          </span>
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>

            {/* Versión del sistema */}
            <div className="border-t border-border/70 px-3 py-4">
              <div
                className={[
                  'flex items-center transition-all duration-200',
                  open ? 'justify-start gap-2 px-1' : 'justify-center',
                ].join(' ')}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-600/10 text-[10px] font-semibold text-emerald-600">
                  v
                </div>
                {open && (
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    Versión 1.6.18
                  </span>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}