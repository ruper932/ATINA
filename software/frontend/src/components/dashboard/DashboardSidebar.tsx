import { NavLink } from 'react-router-dom'
import { dashboardNavItems } from '@/config/navigation'
import { useAuth } from '@/hooks/useAuth'

export function DashboardSidebar() {
  const { role } = useAuth()

  const visibleItems = dashboardNavItems.filter((item) =>
    role ? item.allowedRoles.includes(role) : false
  )

  return (
    <aside className="w-72 border-r bg-card min-h-screen">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">ATINA</h2>
        <p className="text-sm text-muted-foreground capitalize">
          Panel de control {role ? `- ${role}` : ''}
        </p>
      </div>

      <nav className="p-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}