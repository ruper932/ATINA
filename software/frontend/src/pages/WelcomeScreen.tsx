import { Link } from 'react-router-dom'
import { CloudRain, Cpu, BarChart3, ArrowRight, Leaf } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginModal } from '@/components/LoginModal'
import { AppNavbar } from '@/components/AppNavbar'

function FeatureCard({
  icon: Icon,
  title,
  description,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  body: string
}) {
  return (
    <Card className="h-full rounded-3xl border border-border/70 bg-card shadow-sm transition-colors">
      <CardHeader className="space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200/70 bg-emerald-50/80 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
          <Icon className="h-5 w-5" />
        </div>

        <div className="space-y-1.5">
          <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  )
}

export default function WelcomeScreen() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNavbar />

      <main>
        <section className="relative border-b border-border/60">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_38%)] dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_38%)]" />

          <div className="container relative mx-auto px-4 py-16 md:px-6 md:py-24 lg:py-28">
            <div className="mx-auto max-w-5xl">
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center rounded-full border border-border/70 bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
                  <Leaf className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Proyecto de Grado · Ingeniería de Sistemas
                </div>

                <div className="mt-6 space-y-6">
                  <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
                    Sistema inteligente de monitoreo y predicción de{' '}
                    <span className="text-emerald-600 dark:text-emerald-400">agua</span>
                  </h1>

                  <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-xl">
                    ATINA optimiza la gestión hídrica mediante atrapanieblas, IoT y modelos
                    predictivos para fortalecer la continuidad de los invernaderos académicos en
                    Titicachi, Bolivia.
                  </p>
                </div>

                <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                  <LoginModal>
                    <Button size="lg" className="w-full gap-2 rounded-xl sm:w-auto">
                      Acceder al sistema
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </LoginModal>

                  <Link to="/register">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full rounded-xl border-border/70 sm:w-auto"
                    >
                      Crear una cuenta
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-14 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Enfoque
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Captación y uso eficiente del agua
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Tecnología
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Sensores IoT, MCP y analítica predictiva
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Impacto
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Apoyo a decisiones en invernaderos académicos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/20">
          <div className="container mx-auto px-4 py-14 md:px-6 md:py-20">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Pilares del sistema
              </h2>
              <p className="mt-3 text-muted-foreground">
                Una plataforma orientada a captar, monitorear y proyectar el uso del agua con apoyo
                de sensores y analítica predictiva.
              </p>
            </div>

            <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
              <FeatureCard
                icon={CloudRain}
                title="Captación eficiente"
                description="Uso de atrapanieblas"
                body="Aprovecha la niebla altoandina como fuente hídrica alternativa para reducir la dependencia del ojo de agua comunitario."
              />

              <FeatureCard
                icon={Cpu}
                title="Monitoreo IoT y MCP"
                description="Estación meteorológica local"
                body="Sensores ESP32 miden variables climáticas y caudal, operando localmente sin depender de forma estricta de internet."
              />

              <FeatureCard
                icon={BarChart3}
                title="Machine Learning"
                description="Modelos predictivos"
                body="Proyecta volumen de agua, estima requerimientos de riego y permite simular escenarios futuros para apoyar decisiones."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background">
        <div className="container mx-auto flex flex-col items-center justify-center gap-2 px-4 py-6 text-center md:px-6">
          <p className="text-sm text-muted-foreground">
            © 2026 Proyecto Integrador Intermedio I - UNIFRANZ
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            Desarrollado por Limber Ignacio Romero Urrelo
            <Leaf className="h-3 w-3 text-emerald-500" />
          </p>
        </div>
      </footer>
    </div>
  )
}