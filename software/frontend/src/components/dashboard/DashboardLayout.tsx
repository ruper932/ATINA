import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { useAuth } from '@/hooks/useAuth'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, role } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b px-6 flex items-center justify-between bg-background">
          <div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground capitalize">
              Rol actual: {role ?? 'sin rol'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={logout}>
              Cerrar sesión
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}