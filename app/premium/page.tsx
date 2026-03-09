import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export const metadata = {
  robots: { index: false, follow: false },
}
import { PageWrapper } from "@/components/layout/page-wrapper"
import { PremiumClientWrapper } from "./premium-client-wrapper"
import { getUserSelections, getSelectedPredictions } from "@/lib/credits"

export default async function PremiumPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!user.is_premium) {
    redirect("/pricing")
  }

  // Obtener contratos activos (selecciones de tipo "user")
  const activeContracts = (await getUserSelections(user.id)).filter(
    s => s.selection_type === "user"
  )

  // Obtener pronósticos de selecciones activas (expertos y números)
  const selectedPredictions = await getSelectedPredictions(user.id)

  // Agrupar pronósticos por fecha
  const groupedByDate = selectedPredictions.reduce((acc, pred) => {
    const dateKey = pred.draw_date
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(pred)
    return acc
  }, {} as Record<string, typeof selectedPredictions>)

  // Tomar solo la última fecha
  const recentDates = Object.keys(groupedByDate)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 1)

  return (
    <PageWrapper user={{ username: user.username, role: user.role, is_premium: user.is_premium }}>
      <div className="min-h-screen bg-linear-to-br from-background via-amber-50/20 dark:via-amber-950/10 to-background relative">
        {/* Elementos decorativos de fondo */}
        <div className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-linear-to-br from-yellow-400 to-amber-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-0 w-96 h-96 bg-linear-to-bl from-purple-400 to-pink-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-linear-to-t from-amber-400 to-yellow-500 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto py-8 px-4 relative z-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-linear-to-br from-yellow-300 to-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-400/30">
              <span className="text-2xl">👑</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-linear-to-r from-yellow-600 via-amber-600 to-orange-600 dark:from-yellow-400 dark:via-amber-400 dark:to-orange-400 bg-clip-text text-transparent">Zona Premium</h1>
              <p className="text-muted-foreground">
                Herramientas avanzadas exclusivas para suscriptores
              </p>
            </div>
          </div>
        </div>

        <PremiumClientWrapper 
          user={user} 
          activeContracts={activeContracts}
          groupedByDate={groupedByDate}
          recentDates={recentDates}
        />
        </div>
      </div>
    </PageWrapper>
  )
}
