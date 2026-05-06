import { Link } from 'react-router-dom'
import { CloudRain, Cpu, BarChart3, ArrowRight, Leaf } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginModal } from '@/components/LoginModal'
import { AppNavbar } from '@/components/AppNavbar'

export default function WelcomeScreen() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppNavbar />

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex flex-col items-center justify-center text-center px-4">
          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium">
              <span className="text-primary mr-2">🌱</span>
              Proyecto de Grado - Ingeniería de Sistemas
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Sistema Inteligente de Monitoreo y Predicción de <span className="text-primary">Agua</span>
            </h1>

            <p className="mx-auto max-w-2xl text-muted-foreground md:text-xl leading-relaxed">
              Optimizando la gestión hídrica mediante atrapanieblas, IoT y Machine Learning para el Centro de Educación Alternativa Cetha Ildefonso de las Muñecas en Titicachi, Bolivia.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <LoginModal>
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Acceder al Sistema <ArrowRight className="h-4 w-4" />
                </Button>
              </LoginModal>

              <Link to="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Crear una cuenta
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Pilares del Sistema</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                ATINA transforma la captación pasiva de agua en una solución inteligente para garantizar la continuidad de los invernaderos académicos.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <Card className="bg-background">
                <CardHeader>
                  <CloudRain className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Captación Eficiente</CardTitle>
                  <CardDescription>Uso de atrapanieblas</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Aprovechamiento de la niebla altoandina como fuente hídrica alternativa para reducir la dependencia del ojo de agua comunitario.
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardHeader>
                  <Cpu className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Monitoreo IoT y MCP</CardTitle>
                  <CardDescription>Estación meteorológica local</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Sensores ESP32 que miden clima y caudal, comunicándose localmente a través del protocolo MCP sin dependencia estricta de internet.
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Machine Learning</CardTitle>
                  <CardDescription>Modelos predictivos</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Predicción del volumen de agua, cálculo automatizado de requerimientos de riego y simulación de escenarios futuros.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-6 border-t border-border/40 bg-background text-center flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-muted-foreground">
          © 2026 Proyecto Integrador Intermedio I - UNIFRANZ
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Desarrollado por Limber Ignacio Romero Urrelo <Leaf className="h-3 w-3 text-green-500" />
        </p>
      </footer>
    </div>
  )
}