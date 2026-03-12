import SyntheticUsersPanel from "@/components/admin/synthetic-users-panel"
import DropboxSyncPanel from "@/components/admin/dropbox-sync-panel"
import RankingUpdatePanel from "@/components/admin/ranking-update-panel"
import { VerificationPanel } from "@/components/admin/verification-panel"
import { ResultsVerificationButton } from "@/components/admin/results-verification-button"
import { MarketingPanel } from "@/components/admin/marketing-panel"
import { AdminNotificationsPanel } from "@/components/admin/notifications-panel"
import PnGAuditPanel from "@/components/admin/pyg-audit-panel"
import { MLClusteringSynthetics } from "@/components/admin/ml-clustering-synthetics"
import { TableStructureChecker } from "@/components/admin/table-structure-checker"
import { Suspense } from "react"
import ManualPaymentsPanel from "@/components/admin/manual-payments-panel"
import { getLotteryResults } from "@/lib/verification"
import { ResultsTable } from "@/components/lottery/results-table"
import { Skeleton } from "@/components/ui/skeleton"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import AdminDashboardSummary from "@/components/admin/dashboard-summary"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/admin/admin-tabs-panel"
import { getCurrentUser } from "@/lib/auth"
import PostedPredictionsPanel from "@/components/admin/posted-predictions-panel"
import ManualLiteRecommendationsButton from "@/components/admin/manual-lite-recommendations-button"

export const metadata = {
  robots: { index: false, follow: false },
}

/**
 * INTERFAZ CORREGIDA
 * Añadimos las propiedades faltantes para que coincida exactamente con ResultsTable
 */
interface LotteryResult {
  id: number
  lottery_name: string
  lottery_type: string
  winning_number: string
  draw_date: string
  draw_time: string
  digits_4?: string | null
  digits_3?: string | null
  digits_2?: string | null
  source?: string
  verified_at: string
}

// Actualización: paginación real
// ...existing code...
async function ResultsList({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number }) {
  try {
    const offset = (page - 1) * pageSize;
    const data = await getLotteryResults(undefined, pageSize, offset);
    const recentResults = (data as LotteryResult[]).filter(res =>
      res.lottery_name && res.lottery_type && res.draw_time
    );
    if (!recentResults || recentResults.length === 0) {
      return (
        <div className="text-center py-10 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">No hay resultados recientes para mostrar.</p>
        </div>
      );
    }
    return <ResultsTable results={recentResults} />;
  } catch (error) {
    console.error("Error fetching lottery results:", error);
    return (
      <div className="p-4 border border-destructive/20 bg-destructive/10 text-destructive rounded-md text-sm">
        No se pudieron cargar los resultados.
      </div>
    );
  }
}


/**
 * Placeholder visual (Skeleton) mientras carga Suspense
 */
function TablePlaceholder() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  // 1. Protección de ruta: Usuario autenticado
  if (!user) {
    return redirect("/login");
  }
  // 2. Protección de ruta: Rol de administrador
  if (user.role !== "admin") {
    return redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-emerald-50/20 dark:via-emerald-950/10 to-background relative">
      <div className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-linear-to-br from-emerald-400 to-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute top-80 right-0 w-80 h-80 bg-linear-to-bl from-sky-400 to-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-linear-to-t from-amber-400 to-orange-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Navegación y Título */}
        <header className="rounded-2xl border border-emerald-300/40 dark:border-emerald-700/30 bg-white/65 dark:bg-slate-900/35 backdrop-blur-sm p-5">
          <Button variant="ghost" asChild className="mb-4 group">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Volver al Dashboard
            </Link>
          </Button>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm backdrop-blur dark:border-emerald-500/40 dark:bg-slate-900/70 dark:text-emerald-200 mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            Zona de control interno
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-2 bg-linear-to-r from-emerald-700 via-cyan-700 to-blue-700 dark:from-emerald-300 dark:via-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestión de verificación, pagos y sincronización de resultados.</p>
        </header>

        <div className="rounded-2xl border border-emerald-200/40 dark:border-emerald-700/30 bg-white/50 dark:bg-slate-900/25 backdrop-blur-sm p-3 md:p-4">
          <AdminDashboardSummary />
        </div>

        <Tabs defaultValue="clientes" className="space-y-6">
          <TabsList className="bg-white/70 dark:bg-slate-900/70 border border-emerald-200/50 dark:border-emerald-700/40 rounded-xl p-1.5 backdrop-blur-sm">
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="ml">Machine Learning</TabsTrigger>
            <TabsTrigger value="sync">Sincronización</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="pyg">P&G</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
            <TabsTrigger value="dashtotal">DashTotal</TabsTrigger>
          </TabsList>
          {/* DashTotal */}
          <TabsContent value="dashtotal">
            {/* Sub-sección DashTotal: historial de resultados */}
            {/* DashTotal: historial de resultados */}
            {await import("@/components/admin/dash-total").then(m => <m.default />)}
          </TabsContent>
          {/* Clientes */}
          <TabsContent value="clientes">
            <Tabs defaultValue="payments" className="rounded-2xl border border-emerald-200/40 dark:border-emerald-700/30 bg-white/50 dark:bg-slate-900/25 backdrop-blur-sm p-4 space-y-4">
              <TabsList className="bg-white/70 dark:bg-slate-900/70 border border-emerald-200/50 dark:border-emerald-700/40 rounded-xl p-1.5 backdrop-blur-sm">
                <TabsTrigger value="payments">Pagos Pendientes</TabsTrigger>
              </TabsList>
              <TabsContent value="payments">
                <div className="max-w-4xl space-y-4">
                  <div className="bg-card p-6 rounded-xl border shadow-xs">
                    <h2 className="text-xl font-semibold mb-1">Solicitudes de Pago Manual</h2>
                    <p className="text-sm text-muted-foreground mb-6">Valida los comprobantes de transferencia subidos por los usuarios.</p>
                    <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                      <ManualPaymentsPanel />
                    </Suspense>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
          {/* Machine Learning */}
          <TabsContent value="ml">
            <Tabs defaultValue="ml-clustering" className="rounded-2xl border border-emerald-200/40 dark:border-emerald-700/30 bg-white/50 dark:bg-slate-900/25 backdrop-blur-sm p-4 space-y-4">
              <TabsList className="bg-white/70 dark:bg-slate-900/70 border border-emerald-200/50 dark:border-emerald-700/40 rounded-xl p-1.5 backdrop-blur-sm">
                <TabsTrigger value="ml-clustering">ML Clustering</TabsTrigger>
                <TabsTrigger value="ml-utilities">ML Utilities</TabsTrigger>
                <TabsTrigger value="synthetics">Usuarios AI</TabsTrigger>
              </TabsList>
              <TabsContent value="ml-clustering">
                <div className="max-w-6xl space-y-4">
                  <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                    <MLClusteringSynthetics />
                  </Suspense>
                </div>
              </TabsContent>
              <TabsContent value="ml-utilities">
                <div className="max-w-6xl space-y-4">
                  <Button asChild className="mb-4">
                    <Link href="/admin/ml-utilities">Ver ML Utilities Completo →</Link>
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="synthetics">
                <div className="max-w-6xl space-y-4">
                  <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                    <SyntheticUsersPanel />
                  </Suspense>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
          {/* Sincronización */}
          <TabsContent value="sync">
            <Tabs defaultValue="dropbox" className="rounded-2xl border border-emerald-200/40 dark:border-emerald-700/30 bg-white/50 dark:bg-slate-900/25 backdrop-blur-sm p-4 space-y-4">
              <TabsList className="bg-white/70 dark:bg-slate-900/70 border border-emerald-200/50 dark:border-emerald-700/40 rounded-xl p-1.5 backdrop-blur-sm">
                <TabsTrigger value="dropbox">Sincronización Dropbox</TabsTrigger>
                <TabsTrigger value="verification">Verificación</TabsTrigger>
                <TabsTrigger value="results">Resultados</TabsTrigger>
                <TabsTrigger value="posted-predictions">Pronósticos</TabsTrigger>
              </TabsList>
              <TabsContent value="dropbox">
                <div className="max-w-4xl space-y-4">
                  <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                    <DropboxSyncPanel />
                  </Suspense>
                </div>
              </TabsContent>
              <TabsContent value="verification">
                <div className="max-w-4xl">
                  <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                    <VerificationPanel />
                  </Suspense>
                </div>
              </TabsContent>
              <TabsContent value="results">
                <div className="max-w-4xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">Historial de Sorteos</h2>
                      <p className="text-sm text-muted-foreground">Últimos 20 resultados registrados.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                        <ResultsVerificationButton />
                      </Suspense>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/admin/results">Subir CSV</Link>
                      </Button>
                    </div>
                  </div>
                  <Suspense fallback={<TablePlaceholder />}>
                    <ResultsList page={1} pageSize={20} />
                  </Suspense>
                </div>
              </TabsContent>
              <TabsContent value="posted-predictions">
                <div className="max-w-5xl space-y-4">
                  <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                    <PostedPredictionsPanel />
                  </Suspense>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
          {/* Marketing */}
          <TabsContent value="marketing">
            <div className="rounded-2xl border border-emerald-200/40 dark:border-emerald-700/30 bg-white/50 dark:bg-slate-900/25 backdrop-blur-sm p-4">
              <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                <MarketingPanel />
              </Suspense>
            </div>
          </TabsContent>
          {/* Notificaciones */}
          <TabsContent value="notificaciones">
            <div className="rounded-2xl border border-emerald-200/40 dark:border-emerald-700/30 bg-white/50 dark:bg-slate-900/25 backdrop-blur-sm p-4">
              <div className="mb-4 max-w-3xl">
                <ManualLiteRecommendationsButton />
              </div>
              <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                <AdminNotificationsPanel />
              </Suspense>
            </div>
          </TabsContent>
          {/* Ranking */}
          <TabsContent value="ranking">
            <div className="rounded-2xl border border-emerald-200/40 dark:border-emerald-700/30 bg-white/50 dark:bg-slate-900/25 backdrop-blur-sm p-4">
              <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                <div className="max-w-6xl space-y-4">
                  <RankingUpdatePanel />
                </div>
              </Suspense>
            </div>
          </TabsContent>
          {/* P&G */}
          <TabsContent value="pyg">
            <div className="rounded-2xl border border-emerald-200/40 dark:border-emerald-700/30 bg-white/50 dark:bg-slate-900/25 backdrop-blur-sm p-4">
              <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                <div className="max-w-6xl space-y-4">
                  <PnGAuditPanel />
                </div>
              </Suspense>
            </div>
          </TabsContent>
          {/* Debug */}
          <TabsContent value="debug">
            <div className="rounded-2xl border border-emerald-200/40 dark:border-emerald-700/30 bg-white/50 dark:bg-slate-900/25 backdrop-blur-sm p-4">
              <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                <div className="max-w-4xl space-y-4">
                  <TableStructureChecker />
                </div>
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
