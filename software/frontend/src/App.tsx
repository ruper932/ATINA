import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'


import WelcomeScreen from '@/pages/WelcomeScreen'
import RegisterScreen from '@/pages/RegisterScreen'
import LoginScreen from '@/pages/LoginScreen'
import DashboardHome from '@/pages/dashboard/DashboardHome'
import UsuariosPage from '@/pages/dashboard/UsuariosPage'
import RolesPage from '@/pages/dashboard/RolesPage'
import InvernaderosPage from '@/pages/dashboard/InvernaderosPage'
import UbicacionesPage from '@/pages/dashboard/UbicacionesPage'
import DispositivosPage from '@/pages/dashboard/DispositivosPage'
import SensoresPage from '@/pages/dashboard/SensoresPage'
import { ReportesVistasPage } from '@/pages/dashboard/ReportesVistasPage' 
import FuentesAguaPage from './pages/dashboard/FuentesAguaPage'
import FuenteAtrapanieblaPage from './pages/dashboard/FuenteAtrapanieblaPage'
import PerfilPage from '@/pages/dashboard/PerfilPage'

import { ThemeProvider } from '@/components/theme-provider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { RoleRoute } from '@/components/auth/RoleRoute'
import { AuthProvider } from '@/context/AuthContext'
import AtrapanieblasPage from './pages/dashboard/AtrapanieblasPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
              <Routes>
                <Route path="/" element={<WelcomeScreen />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />

                <Route
                  path="/dashboard"
                  element={
                    <RoleRoute allowedRoles={['admin', 'tecnico', 'docente', 'invitado']}>
                      <DashboardLayout>
                        <DashboardHome />
                      </DashboardLayout>
                    </RoleRoute>
                  }
                />

                <Route
                  path="/dashboard/usuarios"
                  element={
                    <RoleRoute allowedRoles={['admin']}>
                      <DashboardLayout>
                        <UsuariosPage />
                      </DashboardLayout>
                    </RoleRoute>
                  }
                />

                <Route
                  path="/dashboard/roles"
                  element={
                    <RoleRoute allowedRoles={['admin']}>
                      <DashboardLayout>
                        <RolesPage />
                      </DashboardLayout>
                    </RoleRoute>
                  }
                />

                <Route
                  path="/dashboard/invernaderos"
                  element={
                    <RoleRoute allowedRoles={['admin', 'tecnico', 'docente']}>
                      <DashboardLayout>
                        <InvernaderosPage />
                      </DashboardLayout>
                    </RoleRoute>
                  }
                />

                <Route
                  path="/dashboard/ubicaciones"
                  element={
                    <RoleRoute allowedRoles={['admin', 'tecnico', 'docente']}>
                      <DashboardLayout>
                        <UbicacionesPage />
                      </DashboardLayout>
                    </RoleRoute>
                  }
                />

                <Route
                  path="/dashboard/atrapanieblas"
                  element={
                    <RoleRoute allowedRoles={['admin', 'tecnico', 'docente']}>
                      <DashboardLayout>
                        <AtrapanieblasPage />
                      </DashboardLayout>
                    </RoleRoute>
                  }
                />

                <Route
                  path="/dashboard/dispositivos"
                  element={
                    <RoleRoute allowedRoles={['admin', 'tecnico', 'docente']}>
                      <DashboardLayout>
                        <DispositivosPage />
                      </DashboardLayout>
                    </RoleRoute>
                  }
                />

                {/* --- NUEVA RUTA PARA SENSORES --- */}
                <Route
                  path="/dashboard/sensores"
                  element={
                    <RoleRoute allowedRoles={['admin', 'tecnico', 'docente']}>
                      <DashboardLayout>
                        <SensoresPage />
                      </DashboardLayout>
                    </RoleRoute>
                  }
                />
                <Route
                  path="/dashboard/reportes"
                  element={
                    <RoleRoute allowedRoles={['admin', 'tecnico', 'docente']}>
                      <DashboardLayout>
                        <ReportesVistasPage />
                      </DashboardLayout>
                    </RoleRoute>
                    
                  }
                />
                <Route
                  path="/dashboard/fuentes-agua"
                  element={
                    <RoleRoute allowedRoles={['admin', 'tecnico', 'docente']}>
                      <DashboardLayout>
                        <FuentesAguaPage />
                      </DashboardLayout>
                    </RoleRoute>
                  }
                />

                <Route
                  path="/dashboard/fuentes-agua-atrapanieblas"
                  element={
                    <RoleRoute allowedRoles={['admin', 'tecnico', 'docente']}>
                      <DashboardLayout>
                        <FuenteAtrapanieblaPage />
                      </DashboardLayout>
                    </RoleRoute>
                  }
                />
                <Route
                  path="/dashboard/perfil"
                  element={
                    <RoleRoute allowedRoles={['admin', 'tecnico', 'docente', 'estudiante', 'invitado']}>
                      <DashboardLayout>
                        <PerfilPage />
                      </DashboardLayout>
                    </RoleRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}