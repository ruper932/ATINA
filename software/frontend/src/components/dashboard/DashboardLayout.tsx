import { useState } from 'react'

import { AppNavbar } from '@/components/AppNavbar'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardSidebar
        open={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen ml-20">
        <AppNavbar showAuthActions={false} />
        <main className="min-h-[calc(100vh-4rem)] px-4 py-4 md:px-6 md:py-6">
          {children}
        </main>
      </div>
    </div>
  )
}