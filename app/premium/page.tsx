import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { PremiumClient } from "./premium-client"
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
    <PageWrapper user={{ username: user.username, role: user.role }}>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-linear-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👑</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold">Zona Premium</h1>
              <p className="text-muted-foreground">
                Herramientas avanzadas exclusivas para suscriptores
              </p>
            </div>
          </div>
        </div>

        <PremiumClient 
          user={user} 
          activeContracts={activeContracts}
          groupedByDate={groupedByDate}
          recentDates={recentDates}
        />
      </div>
    </PageWrapper>
  )
}
