import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CloudRain,
  Cpu,
  Database,
  Droplets,
  Gauge,
  Leaf,
  MapPin,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Sprout,
} from 'lucide-react'

import { apiClient } from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

type StatCard = {
  title: string
  value: string
  helper: string
  icon: React.ElementType
  tone: 'emerald' | 'teal' | 'amber' | 'rose' | 'blue' | 'violet'
  href: string
}

type QuickLink = {
  title: string
  description: string
  href: string
  icon: React.ElementType
}

type HealthResponse = {
  status?: string
  message?: string
  detail?: string
}

type GenericNamedEntity = {
  id: number
  nombre?: string | null
  codigo?: string | null
  creado_en?: string
  estado_dispositivo_nombre?: string | null
  estado_sensor_nombre?: string | null
  estado_invernadero_nombre?: string | null
  estado_fuente_agua_nombre?: string | null
  estado_atrapaniebla_nombre?: string | null
}

type AlertaEntity = {
  id: number
  tipo_alerta?: string | null
  mensaje?: string | null
  leida?: boolean | null
  atendida?: boolean | null
  resuelta?: boolean | null
  creado_en?: string
  fecha_generacion?: string
}

type PrediccionEntity = {
  id: number
  modelo_usado?: string | null
  volumen_predicho_l?: number | null
  creado_en?: string
  fecha_objetivo?: string
}

type SincronizacionEntity = {
  id: number
  estado_sincronizacion_nombre?: string | null
  origen?: string | null
  destino?: string | null
  fecha_inicio?: string | null
  fecha_fin?: string | null
}

type DashboardBundle = {
  health: HealthResponse
  dbHealth: HealthResponse
  invernaderos: GenericNamedEntity[]
  ubicaciones: GenericNamedEntity[]
  atrapanieblas: GenericNamedEntity[]
  fuentesAgua: GenericNamedEntity[]
  dispositivos: GenericNamedEntity[]
  sensores: GenericNamedEntity[]
  actuadores: GenericNamedEntity[]
  alertas: AlertaEntity[]
  predicciones: PrediccionEntity[]
  sincronizaciones: SincronizacionEntity[]
}

const quickLinks: QuickLink[] = [
  {
    title: 'Infraestructura',
    description: 'Ubicaciones, invernaderos, atrapanieblas y fuentes de agua.',
    href: '/dashboard/invernaderos',
    icon: Leaf,
  },
  {
    title: 'IoT y dispositivos',
    description: 'Dispositivos, sensores y monitoreo operativo.',
    href: '/dashboard/dispositivos',
    icon: Gauge,
  },
  {
    title: 'Gestión de riego',
    description: 'Seguimiento de operación hídrica y fuentes de agua.',
    href: '/dashboard/fuentes-agua',
    icon: Droplets,
  },
  {
    title: 'Reportes',
    description: 'Vistas analíticas, alertas, inventario y predicciones.',
    href: '/dashboard/reportes',
    icon: Activity,
  },
]

const toneMap = {
  emerald:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300',
  teal:
    'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/40 dark:bg-teal-950/20 dark:text-teal-300',
  amber:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300',
  rose:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300',
  blue:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300',
  violet:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-300',
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function getHealthLabel(value?: string | null) {
  const normalized = String(value ?? '').toLowerCase()
  if (
    normalized.includes('ok') ||
    normalized.includes('healthy') ||
    normalized.includes('up') ||
    normalized.includes('activo')
  ) {
    return 'Online'
  }
  return value ?? 'Sin dato'
}

function getHealthProgress(value?: string | null) {
  const normalized = String(value ?? '').toLowerCase()
  if (
    normalized.includes('ok') ||
    normalized.includes('healthy') ||
    normalized.includes('up') ||
    normalized.includes('activo')
  ) {
    return 100
  }
  return 35
}

function getRecentDate<T>(rows: T[], getter: (row: T) => string | null | undefined) {
  const validDates = rows
    .map(getter)
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())

  return validDates[0]?.toISOString() ?? null
}

function MetricCard({ item }: { item: StatCard }) {
  const Icon = item.icon

  return (
    <Link to={item.href} className="block">
      <Card className="h-full rounded-[24px] border border-border/70 bg-card shadow-none transition-all hover:border-primary/30 hover:bg-accent/30">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="space-y-2">
            <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {item.title}
            </CardDescription>
            <CardTitle className="text-4xl font-bold tracking-tight text-foreground">
              {item.value}
            </CardTitle>
          </div>

          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${toneMap[item.tone]}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </CardHeader>

        <CardContent className="flex items-center justify-between gap-3 pt-0">
          <p className="text-sm leading-6 text-muted-foreground">{item.helper}</p>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function SurfaceCard({
  title,
  description,
  children,
  action,
  className = '',
}: {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`rounded-[24px] border border-border/70 bg-card shadow-none ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1 text-sm leading-6">{description}</CardDescription>
            )}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function DashboardHome() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard-home'],
    queryFn: async (): Promise<DashboardBundle> => {
      const [
        health,
        dbHealth,
        invernaderos,
        ubicaciones,
        atrapanieblas,
        fuentesAgua,
        dispositivos,
        sensores,
        actuadores,
        alertas,
        predicciones,
        sincronizaciones,
      ] = await Promise.all([
        apiClient.get('/health/').then((r) => r.data),
        apiClient.get('/health/db').then((r) => r.data),
        apiClient.get('/infra/invernaderos').then((r) => r.data),
        apiClient.get('/infra/ubicaciones').then((r) => r.data),
        apiClient.get('/infra/atrapanieblas').then((r) => r.data),
        apiClient.get('/infra/fuentes-agua').then((r) => r.data),
        apiClient.get('/iot/').then((r) => r.data),
        apiClient.get('/iot/sensores').then((r) => r.data),
        apiClient.get('/iot/actuadores').then((r) => r.data),
        apiClient.get('/alertas/').then((r) => r.data),
        apiClient.get('/ml/predicciones').then((r) => r.data),
        apiClient.get('/reportes/sincronizaciones').then((r) => r.data),
      ])

      return {
        health,
        dbHealth,
        invernaderos,
        ubicaciones,
        atrapanieblas,
        fuentesAgua,
        dispositivos,
        sensores,
        actuadores,
        alertas,
        predicciones,
        sincronizaciones,
      }
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const data = dashboardQuery.data

  const totalInfraestructura = useMemo(() => {
    if (!data) return 0
    return (
      data.ubicaciones.length +
      data.invernaderos.length +
      data.atrapanieblas.length +
      data.fuentesAgua.length
    )
  }, [data])

  const totalIoT = useMemo(() => {
    if (!data) return 0
    return data.dispositivos.length + data.sensores.length + data.actuadores.length
  }, [data])

  const alertasPendientes = useMemo(() => {
    if (!data) return 0
    return data.alertas.filter(
      (a) => a.atendida === false || a.resuelta === false || a.leida === false
    ).length
  }, [data])

  const totalPredicciones = data?.predicciones.length ?? 0

  const activeStats: StatCard[] = useMemo(
    () => [
      {
        title: 'Invernaderos',
        value: String(data?.invernaderos.length ?? 0),
        helper: `${data?.ubicaciones.length ?? 0} ubicaciones registradas`,
        icon: Sprout,
        tone: 'emerald',
        href: '/dashboard/invernaderos',
      },
      {
        title: 'Dispositivos IoT',
        value: String(data?.dispositivos.length ?? 0),
        helper: `${data?.sensores.length ?? 0} sensores y ${data?.actuadores.length ?? 0} actuadores`,
        icon: Radio,
        tone: 'teal',
        href: '/dashboard/dispositivos',
      },
      {
        title: 'Alertas activas',
        value: String(alertasPendientes),
        helper: `${data?.alertas.length ?? 0} alertas registradas`,
        icon: AlertTriangle,
        tone: 'amber',
        href: '/dashboard/reportes',
      },
      {
        title: 'Predicciones ML',
        value: String(totalPredicciones),
        helper: `${data?.sincronizaciones.length ?? 0} sincronizaciones registradas`,
        icon: BrainCircuit,
        tone: 'violet',
        href: '/dashboard/reportes',
      },
    ],
    [data, alertasPendientes, totalPredicciones]
  )

  const apiStatus = getHealthLabel(data?.health?.status ?? data?.health?.message)
  const dbStatus = getHealthLabel(data?.dbHealth?.status ?? data?.dbHealth?.message)

  const apiProgress = getHealthProgress(data?.health?.status ?? data?.health?.message)
  const dbProgress = getHealthProgress(data?.dbHealth?.status ?? data?.dbHealth?.message)

  const iotCoverage = useMemo(() => {
    if (!data) return 0

    const dispositivos = data.dispositivos ?? []
    const sensores = data.sensores ?? []

    const totalDispositivos = dispositivos.length
    const totalSensores = sensores.length
    const totalElementos = totalDispositivos + totalSensores

    if (totalElementos === 0) return 0

    const dispositivosActivos = dispositivos.filter((d) =>
      String(d.estado_dispositivo_nombre ?? '').trim().toLowerCase() === 'activo'
    ).length

    const sensoresActivos = sensores.filter((s) =>
      String((s as any).estado_sensor_nombre ?? '').trim().toLowerCase() === 'activo'
    ).length

    return Math.round(((dispositivosActivos + sensoresActivos) / totalElementos) * 100)
  }, [data])

  const alertResolution = useMemo(() => {
    if (!data || data.alertas.length === 0) return 0
    const resolved = data.alertas.filter(
      (a) => a.atendida === true || a.resuelta === true
    ).length
    return Math.round((resolved / data.alertas.length) * 100)
  }, [data])

  const latestPrediccion = getRecentDate(
    data?.predicciones ?? [],
    (row) => row.creado_en ?? row.fecha_objetivo
  )
  const latestSincronizacion = getRecentDate(
    data?.sincronizaciones ?? [],
    (row) => row.fecha_fin ?? row.fecha_inicio
  )

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex h-64 items-center justify-center rounded-[28px] border border-border/70 bg-card">
          <div className="flex items-center gap-3 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Cargando resumen del sistema...
          </div>
        </div>
      </div>
    )
  }

  if (dashboardQuery.isError || !data) {
    return (
      <div className="space-y-6">
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/30 dark:bg-rose-950/20">
          <h1 className="text-2xl font-bold text-rose-700 dark:text-rose-300">
            No se pudo cargar el dashboard
          </h1>
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
            Revisa autenticación, disponibilidad de la API y permisos de acceso a los endpoints.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => dashboardQuery.refetch()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full space-y-6 bg-background">
      <section className="rounded-[28px] border border-border/70 bg-card px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
            >
              Centro de operaciones
            </Badge>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              Supervisa infraestructura, dispositivos IoT, riego, alertas, machine learning y reportes desde una vista unificada del sistema.
            </p>
          </div>

          <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-border/70 bg-background px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Server className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                API
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground">{apiStatus}</p>
              <p className="mt-1 text-xs text-muted-foreground">Estado del servicio principal</p>
            </div>

            <div className="rounded-[22px] border border-border/70 bg-background px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Database className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Base de datos
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground">{dbStatus}</p>
              <p className="mt-1 text-xs text-muted-foreground">Conectividad de persistencia</p>
            </div>

            <div className="rounded-[22px] border border-border/70 bg-background px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                Sincronización
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {data.sincronizaciones.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Procesos registrados</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {activeStats.map((item) => (
          <MetricCard key={item.title} item={item} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <SurfaceCard
          title="Módulos principales"
          description="Accede rápido a las áreas con mayor actividad operativa."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {quickLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.title}
                  to={item.href}
                  className="group rounded-[22px] border border-border/70 bg-background px-4 py-4 transition-colors hover:border-primary/30 hover:bg-accent/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-muted/40">
                      <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground transition-transform group-hover:translate-x-0.5">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-5 space-y-1.5">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Estado general"
          description="Indicadores calculados con datos reales del sistema."
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Salud de la API</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {apiProgress}%
                </span>
              </div>
              <Progress value={apiProgress} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Salud de la base de datos</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {dbProgress}%
                </span>
              </div>
              <Progress value={dbProgress} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cobertura IoT</span>
                <span className="font-semibold text-sky-600 dark:text-sky-400">
                  {iotCoverage}%
                </span>
              </div>
              <Progress value={iotCoverage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Alertas resueltas</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {alertResolution}%
                </span>
              </div>
              <Progress value={alertResolution} className="h-2" />
            </div>

            <div className="rounded-[22px] border border-dashed border-border/80 bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Última predicción</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(latestPrediccion)}</p>
              <p className="mt-4 text-sm font-medium text-foreground">Última sincronización</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateTime(latestSincronizacion)}
              </p>
            </div>
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <SurfaceCard
          title="Panorama del sistema"
          description="Resumen consolidado de entidades registradas en los módulos principales."
          className="lg:col-span-2"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[22px] border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-semibold text-foreground">Infraestructura</p>
              </div>
              <p className="mt-3 text-3xl font-semibold text-foreground">{totalInfraestructura}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {data.ubicaciones.length} ubicaciones, {data.invernaderos.length} invernaderos,
                {` ${data.atrapanieblas.length}`} atrapanieblas y {data.fuentesAgua.length} fuentes de agua.
              </p>
            </div>

            <div className="rounded-[22px] border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <p className="text-sm font-semibold text-foreground">IoT y monitoreo</p>
              </div>
              <p className="mt-3 text-3xl font-semibold text-foreground">{totalIoT}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {data.dispositivos.length} dispositivos, {data.sensores.length} sensores y{' '}
                {data.actuadores.length} actuadores.
              </p>
            </div>

            <div className="rounded-[22px] border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <p className="text-sm font-semibold text-foreground">Operación y alertas</p>
              </div>
              <p className="mt-3 text-3xl font-semibold text-foreground">{data.alertas.length}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {alertasPendientes} pendientes de atención y seguimiento.
              </p>
            </div>

            <div className="rounded-[22px] border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <p className="text-sm font-semibold text-foreground">Analítica y ML</p>
              </div>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {data.predicciones.length + data.sincronizaciones.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {data.predicciones.length} predicciones y {data.sincronizaciones.length} sincronizaciones.
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Acciones rápidas"
          description="Atajos hacia las vistas de trabajo más usadas."
        >
          <div className="flex flex-col gap-3">
            <Button asChild className="justify-between rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700">
              <Link to="/dashboard/invernaderos">
                Ir a invernaderos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="justify-between rounded-2xl">
              <Link to="/dashboard/dispositivos">
                Ir a dispositivos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="justify-between rounded-2xl">
              <Link to="/dashboard/reportes">
                Revisar reportes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="justify-between rounded-2xl">
              <Link to="/dashboard/fuentes-agua">
                Ver fuentes de agua
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </SurfaceCard>
      </section>

      <section className="flex justify-end">
        <Button
          variant="outline"
          className="rounded-2xl"
          onClick={() => dashboardQuery.refetch()}
          disabled={dashboardQuery.isFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${dashboardQuery.isFetching ? 'animate-spin' : ''}`} />
          {dashboardQuery.isFetching ? 'Actualizando...' : 'Actualizar resumen'}
        </Button>
      </section>
    </div>
  )
}