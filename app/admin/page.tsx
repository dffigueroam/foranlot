import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

// Importaciones de lógica y componentes
import { getCurrentUser } from "@/lib/auth"
import { getLotteryResults } from "@/lib/verification"
import { VerificationPanel } from "@/components/admin/verification-panel"
import { ManualPaymentsPanel } from "@/components/admin/manual-payments-panel"
import { DropboxSyncPanel } from "@/components/admin/dropbox-sync-panel"
import { CompensationPanel } from "@/components/admin/compensation-panel"
import { SyntheticUsersPanel } from "@/components/admin/synthetic-users-panel"
import { RankingUpdatePanel } from "@/components/admin/ranking-update-panel"
import { TableStructureChecker } from "@/components/admin/table-structure-checker"
import { ResultsTable } from "@/components/lottery/results-table"
import { ResultsVerificationButton } from "@/components/admin/results-verification-button"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { MarketingPanel } from "@/components/admin/marketing-panel"


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
}

async function ResultsList() {
  try {
    const data = await getLotteryResults(undefined, 20)
    
    // Filtrar solo resultados con datos completos de la BD
    const recentResults = (data as any[]).filter(res => 
      res.lottery_name && res.lottery_type && res.draw_time
    ) as LotteryResult[]

    if (!recentResults || recentResults.length === 0) {
      return (
        <div className="text-center py-10 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">No hay resultados recientes para mostrar.</p>
        </div>
      )
    }

    return <ResultsTable results={recentResults} />
  } catch (error) {
    console.error("Error fetching lottery results:", error)
    return (
      <div className="p-4 border border-destructive/20 bg-destructive/10 text-destructive rounded-md text-sm">
        No se pudieron cargar los resultados.
      </div>
    )
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
  const user = await getCurrentUser()

  // 1. Protección de ruta: Usuario autenticado
  if (!user) {
    redirect("/login")
  }

  // 2. Protección de ruta: Rol de administrador
  if (user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:to-black">
        <div className="container mx-auto px-4 py-8">
          
          {/* Navegación y Título */}
          <header className="mb-8">
            <Button variant="ghost" asChild className="mb-4 group">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Volver al Dashboard
              </Link>
            </Button>

            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground">
              Gestión de verificación, pagos y sincronización de resultados.
            </p>
          </header>

          <Tabs defaultValue="debug" className="space-y-6">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="debug">🔍 Debug</TabsTrigger>
              <TabsTrigger value="sync">Sincronización</TabsTrigger>
              <TabsTrigger value="ranking">Ranking</TabsTrigger>
              <TabsTrigger value="synthetics">Usuarios AI</TabsTrigger>
              <TabsTrigger value="compensation">Compensación</TabsTrigger>
              <TabsTrigger value="payments">Pagos Pendientes</TabsTrigger>
              <TabsTrigger value="verification">Verificación</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
               
         
              
            </TabsList>

            {/* Tab: Debug - Verificar estructura de tabla */}
            <TabsContent value="debug" className="outline-hidden">
              <div className="max-w-4xl space-y-4">
                <TableStructureChecker />
              </div>
            </TabsContent>

            {/* Tab: Sincronización Dropbox */}
            <TabsContent value="sync" className="outline-hidden">
              <div className="max-w-4xl space-y-4">
                <DropboxSyncPanel />
              </div>
            </TabsContent>

            {/* Tab: Actualización Manual del Ranking */}
            <TabsContent value="ranking" className="outline-hidden">
              <div className="max-w-6xl space-y-4">
                <RankingUpdatePanel />
              </div>
            </TabsContent>

            {/* Tab: Usuarios Sintéticos */}
            <TabsContent value="synthetics" className="outline-hidden">
              <div className="max-w-6xl space-y-4">
                <SyntheticUsersPanel />
              </div>
            </TabsContent>

            {/* Tab: Compensación */}
            <TabsContent value="compensation" className="outline-hidden">
              <div className="max-w-4xl space-y-4">
                <CompensationPanel />
              </div>
            </TabsContent>

            {/* Tab: Pagos */}
            <TabsContent value="payments" className="outline-hidden">
              <div className="max-w-4xl space-y-4">
                <div className="bg-card p-6 rounded-xl border shadow-xs">
                  <h2 className="text-xl font-semibold mb-1">Solicitudes de Pago Manual</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Valida los comprobantes de transferencia subidos por los usuarios.
                  </p>
                  <ManualPaymentsPanel />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Verificación */}
            <TabsContent value="verification" className="outline-hidden">
              <div className="max-w-4xl">
                <VerificationPanel />
              </div>
            </TabsContent>

            {/* Tab: Resultados con Suspense */}
            <TabsContent value="results" className="outline-hidden">
              <div className="max-w-4xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Historial de Sorteos</h2>
                    <p className="text-sm text-muted-foreground">Últimos 20 resultados registrados.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ResultsVerificationButton />
                    {/* Botón para ir a la página de subida que creaste anteriormente */}
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/admin/results">Subir CSV</Link>
                    </Button>
                  </div>
                </div>
                <Suspense fallback={<TablePlaceholder />}>
                  <ResultsList />
                </Suspense>
              </div>
            </TabsContent>
            <TabsContent value="marketing">
              <MarketingPanel />
            </TabsContent>

          </Tabs>
        </div>
      </div>
  )
}
