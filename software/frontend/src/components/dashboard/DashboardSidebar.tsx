import { NavLink } from 'react-router-dom'
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

  const visibleItems = dashboardNavItems.filter((item) =>
    role ? item.allowedRoles.includes(role) : false
  )

  return (
    <div
      className="fixed left-0 top-0 z-50 h-screen w-20"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <aside
        className={[
          'absolute left-0 top-0 h-screen overflow-hidden border-r border-border/70 bg-card shadow-2xl transition-all duration-300 ease-out',
          open ? 'w-72' : 'w-20',
        ].join(' ')}
      >
        <div
          className={[
            'flex h-16 items-center border-b border-border/70 px-4 transition-all duration-300',
            open ? 'justify-between' : 'justify-center',
          ].join(' ')}
        >
          {open ? (
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">
                Navegación
              </h2>
              <p className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Panel de control
              </p>
            </div>
          ) : (
            <div className="h-3 w-3 rounded-full bg-emerald-600" />
          )}
        </div>

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
                    title={item.title}
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

          {/* Versión del sistema - añadida al final */}
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
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Versión 1.2.18
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}